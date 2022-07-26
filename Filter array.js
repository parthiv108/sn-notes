//filter out the approved timesheets(timesheetArr) users from the userRoleArr to get the user who need to be be sent the mail
var filtered = userRoleArr.filter(
    function (e) {
        return this.indexOf(e) < 0; //returns true if element e (in userRoleArr) doesn't exist in the timesheetArr ('this' refers to timesheetArr passed as a param)
    },
    timesheetArr
);
