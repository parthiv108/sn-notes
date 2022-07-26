//filter out the approved timesheets(timesheetArr) users from the userRoleArr to get the user who need to be be sent the mail
//this removes the common elements btn the 2 arrays, to give you the elements present in the superset array (userRoleArr), sort of like a minus operation btn 2 sets
var filtered = userRoleArr.filter(
    function (e) {
        return this.indexOf(e) < 0; //returns true if element e (in userRoleArr) doesn't exist in the timesheetArr ('this' refers to timesheetArr passed as a param)
    },
    timesheetArr
);
