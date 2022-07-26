/*
###
receiving files in BAse64 encoded format and adding it to a record as attachments
This was done on a transform map
###
*/
// add attachment to the incident record if it has been provided
	if(source.u_attachment== '' || source.u_attachment_name == ''){ //if attachment or attachment filename has not been provided abort
		//gs.info('pd: aborting as no file info provided');
		return;
	}
	var base64File= source.u_attachment; //The huge base64Encoded string
	var decodedBytes = GlideStringUtil.base64DecodeAsBytes(base64File); //Decodes the base64Encoded Data in Bytes.
	var attach = new GlideSysAttachment();
	var attachmentId = attach.write(target, source.u_attachment_name, '', decodedBytes ); //inserts arecord into to the sys_attachments table with the byte version of the file
	//gs.info('pd: attached file, sys_id = '+attachmentId+', incident number = '+target.number+', incident sys_id= '+target.sys_id);
	
