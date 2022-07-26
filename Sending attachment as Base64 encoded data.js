try {
    var payload = {};
    var fileArray = [];
    //var file1 = getFileData('c93d791edb0891107d43be37f49619da');
    var file1 = getBas64Data('c93d791edb0891107d43be37f49619da');
    //var file2 = getBas64Data('94d4d9101bd815906e5fda86b04bcb63');
    payload.Header = "Header Test 123";
    payload.Footer = "Footer Test 456";
    fileArray.push(file1);
	//fileArray.push(file2);
    //payload.file2 = file2;
    payload.file = fileArray;
    var payloadStr = JSON.stringify(payload);

    var r = new sn_ws.RESTMessageV2('x_nswhs_eref_i_ref.Test PDF', 'Merge PDF2');
    r.setRequestBody(payloadStr);

    r.saveResponseBodyAsAttachment('x_nswhs_ereferral_referral', 'c624aa3a1bc3c554cace55b81d4bcb95', 'merged_pdf.pdf');

    gs.info('pd: payload=' + payloadStr);


    var response = r.execute();
    //var responseBody = response.getBody();
    var httpStatus = response.getStatusCode();
    gs.info('pd: response status = ' + httpStatus);

    //gs.info('pd: response status = ' + httpStatus + ', response body = ' + responseBody);
    //gs.info('pd: response data = '  + JSON.parse(responseBody.data));

} catch (ex) {
    var message = ex.message;
    gs.info('pd: error = ' + ex);
}


function getFileData(id) {
    gs.info('pd: in getFile Data');

    var attGR = new GlideRecord('sys_attachment');
    //attGR.get('1e2466be1bc3c554cace55b81d4bcb68');
    attGR.get(id);
    //attGR.next();
    var sa = new GlideSysAttachment();
    var binData = sa.getBytes(attGR); //only works in global scope
    var encData = GlideStringUtil.base64Encode(binData);
    return encData;
    //return sa.getContentBase64(attGR);
}

function getBas64Data(id) {
    gs.info('pd: in getbase64Data');
    var fileObj = {};
    var attGR = new GlideRecord('sys_attachment');
    attGR.get(id);
    gs.info('pd: file = ' + attGR.getValue('file_name'));
    var sa = new GlideSysAttachment();
    var encData = sa.getContentBase64(attGR); //use this for scoped applicaitons

    fileObj.filename = attGR.getValue('file_name');
    fileObj.Contenttype = attGR.getValue('content_type');
    fileObj.content = encData;
    return fileObj;

}
