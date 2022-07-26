/*
    The section below shows how to upload a file to servicenow instance from a mid server.
    The functions 
	
	
    */

var FileUploadToImportSet = Class.create();
FileUploadToImportSet.prototype = {
    initialize: function () {


        // Get Credential Details for SAP inbound integration user
        var import_cred = new GlideRecord('basic_auth_credentials');
        import_cred.get('6d49ddb81b89cd10881bed7b2f4bcb57');

        this.targetUsername = import_cred.getValue('user_name');
        this.targetPassword = import_cred.getValue('password');

        this.deleteAfterUpload = probe.getParameter("deleteAfterUpload");
        this.filePath = probe.getParameter("localfilePath"); //file path to download to on mid server
        this.fileName = probe.getParameter("fileName");
        this.remoteFilePath = probe.getParameter("remoteFilePath");

        //get instance name to send file to snow instance in the cloud
        this.instanceName = probe.getParameter('instanceName');
        this.stagingTable = probe.getParameter('stagingTable');
        this.transformAfterLoad = probe.getParameter("transformAfterLoad");

        this.sftpFileUtil = new SftpFile();
        this.sftpFileUtil.setTargetPath(this.remoteFilePath);
        this.sftpFileUtil.setMidServerFilePath(this.filePath);
        //this.sftpFileUtil.setMidServerFileName(this.fileName);
        //this.sftpFileUtil.setRemoteFileName(this.fileName);
    },

    performInboundTransfer: function () {
        this.log("Getting File from SAP Server...");
        var contextMessage = "Getting File from SAP Server: ";
        try { //download file(s) from SAP server
            this.sftpFileUtil.FileTransferDownload();
            var downloadedFiles = this.sftpFileUtil.getDownloadedFiles();

            //check if any files were downloaded
            if (downloadedFiles.length <= 0) {
                contextMessage = "No files to upload: ";
                throw "No files were available for download from the SAP server.";
            }

            //upload downloaded file(s) to servicenow
            for (var i = 0; i < downloadedFiles.length; i++) {
                contextMessage = "Trying Upload file " + downloadedFiles[i] + " to import set table Rest API: ";
                this.log("Trying Upload file " + downloadedFiles[i] + " to import set table Rest API...");
                this.uploadFile(downloadedFiles[i]);
            }

            //delete file(s) from mid server after upload is complete
            if (this.deleteAfterUpload == 'true') {
                contextMessage = "Deleting SAP files downloaded on Mid server: ";
                this.delete_files(downloadedFiles);
            }

        } catch (e) {
            this.log("Error occurred in importing SAP file, " + contextMessage + ": " + e);
            this.create_incident("Error occurred in importing SAP file, " + contextMessage + ": " + e);
        }
    },

    uploadFile: function (pfileName) {
        this.charset = "UTF-8";
        var CRLF = "\r\n"; // Line separator required by multipart/form-data.
        var boundary = "===" + new Date().getTime() + "===";

        try {
            this.log("Getting Connection...");
            var url = "https://" + this.instanceName + ".service-now.com/sys_import.do?sysparm_import_set_tablename=" + this.stagingTable + "&sysparm_transform_after_load=" + this.transformAfterLoad;
            this.log("Calling URL: " + url);
            var authPassword = new Packages.com.glide.util.Encrypter().decrypt(this.targetPassword);
            var conn = new Packages.java.net.URL(url).openConnection();
            this.log("User credentials: username:" + this.targetUsername + ", password:" + authPassword);
            var userCredentials = new Packages.java.lang.String(this.targetUsername + ":" + authPassword);
            var basicAuth = "Basic " + Packages.java.util.Base64.getEncoder().encodeToString(userCredentials.getBytes());
            conn.setRequestProperty("Authorization", basicAuth);
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setUseCaches(false);
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setRequestProperty("User-Agent", "MID Server POST");

            this.log("Getting File...");
            var outputStream = conn.getOutputStream();
            var writer = new Packages.java.io.PrintWriter(new Packages.java.io.OutputStreamWriter(outputStream, this.charset), true);
            this.log("Getting file: " + this.filePath + "\\" + pfileName);
            //var uploadFile = new Packages.java.io.File(this.filePath + "\\" + this.fileName);
            var uploadFile = new Packages.java.io.File(this.filePath + "\\" + pfileName);
            var fileName = uploadFile.getName();

            this.log("Writing File Data..." + uploadFile.toPath());
            writer.append("--" + boundary).append(CRLF);
            writer.append("Content-Disposition: form-data; name=\"textFile\"; filename=\"" + uploadFile.getName() + "\"").append(CRLF);
            writer.append("Content-Type: text/plain; charset=" + this.charset).append(CRLF); // Text file itself must be saved in this charset!
            writer.append(CRLF).flush();
            Packages.java.nio.file.Files.copy(uploadFile.toPath(), outputStream);
            outputStream.flush(); // Important before continuing with writer!
            writer.append(CRLF).flush(); // CRLF is important! It indicates end of boundary.
            // End of multipart/form-data.
            writer.append("--" + boundary + "--").append(CRLF).flush();

            this.log("Completing Message...");
            writer.close();
            var responseCode = conn.getResponseCode();
            this.log("Response Code:" + responseCode + " for upload of file: " + pfileName);

            if (responseCode != 200 && responseCode != 201) {
                throw "Unsuccessful reponse code when uploading file: " + pfileName + " to service now. Response code: " + responseCode;
            }

        } catch (e) {
            this.log("ERROR uploading the file: " + e);
            throw e;
        }

    },

    create_incident: function (errormsg) {

        try {
            this.log("Getting Connection for sending incident...");
            var url = "https://" + this.instanceName + ".service-now.com/api/now/table/incident";
            this.log("Calling URL: " + url);
            var authPassword = new Packages.com.glide.util.Encrypter().decrypt(this.targetPassword);
            var conn = new Packages.java.net.URL(url).openConnection();
            this.log("User credentials: username:" + this.targetUsername + ", password:" + authPassword);
            var userCredentials = new Packages.java.lang.String(this.targetUsername + ":" + authPassword);
            var basicAuth = "Basic " + Packages.java.util.Base64.getEncoder().encodeToString(userCredentials.getBytes());
            conn.setRequestProperty("Authorization", basicAuth);
            conn.setDoOutput(true);
            conn.setRequestMethod("POST");
            conn.setUseCaches(false);
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("User-Agent", "MID Server POST");

            var payload = '{' +
                ' "short_description":"Error importing SAP Expense File", ' +
                '    "caller_id":"180c19fc1b89cd10881bed7b2f4bcbc8", ' + //sap inbound integration user
                '    "description":"Details of the error: ' + errormsg + '",' +
                '    "assignment_group":"6419c4c5dbe1801018c0abf34a961905" ' + //servicenow dev ops team
                ' }';

            var outputStream = conn.getOutputStream();
            var writer = new Packages.java.io.PrintWriter(new Packages.java.io.OutputStreamWriter(outputStream, "UTF-8"), true);
            writer.write(payload);
            outputStream.flush();
            writer.close();
            this.log("Response Code:" + conn.getResponseCode() + " for logging incident");

        } catch (e) {
            ms.log("Error creating incident: " + e);

        }
    },

    delete_files: function (fileList) {
        for (var i = 0; i < fileList.length; i++) {
            var file = new Packages.java.io.File(this.filePath + "\\" + fileList[i]);
            var deleted = file['delete']();
            this.log("Deleted file: " + this.filePath + "\\" + fileList[i] + " : " + deleted);
        }

    },


    log: function (data) {
        ms.log("FileUploadToImportSet: " + data);
    },


};
