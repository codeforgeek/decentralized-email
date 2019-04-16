$(function () {
var month = [
    'JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'
]

    // list all mails
    var $emails = ('#emails')
    $('#Inbox').click(function (e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '../api/email',
            success: function (data) {
                if (data.error) {
                    alert(data.message)
                } else {
                    $(emails).html('');
                    $.each(data.data, function (i, email) {
                        var sender = email.from.split("@");
                        // var time = new Date(email.time).toUTCString()
                        var dt = new Date(email.time);
                        var time = dt.getDate()+" "+ month[dt.getMonth()] + " " +dt.getHours() + ":" + dt.getMinutes();
                        var subject = (email.subject ? email.subject : "(NO SUBJECT)");
                        $(emails).append('<li style = \" font-weight: bold;list-style-type:none;padding:8px 16px;\" id="emailid" onclick="readMail(\'' + email._id + '\')">' + "From: " + sender[0] + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "Subject: " + subject + "<span class = \"date;\">" + time + '</li>')
                    })
                }
            },
            error: function () {
                alert("error");
            }
        })
    });

    // get all contacts in list
    $('#Contacts').click(function (e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '../api/user/contacts',
            success: function (data) {
                $(emails).html('');
                $.each(data.data, function (i, contact) {
                    var contactEmail = contact.contactEmail.split("@");
                    if (contact.status == 1)
                        $(emails).append('<li>Name:' + contactEmail[0] + '</li>')
                })
            },
            error: function () {
                alert("error");
            }
        })
    });

    // get user contact requests
    $('#ContactRequests').click(function (e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '../api/user/contacts/request',
            success: function (data) {
                $(emails).html('');
                $.each(data.data, function (i, contact) {
                    var contactEmail = contact.contactEmail.split("@");
                    $(emails).append('<li>Name:' + contactEmail[0] + '<button onclick="approve(\'' + contact._id + '\')">Approve</button> &nbsp;&nbsp;&nbsp;&nbsp;<button onclick="reject(\'' + contact._id + '\')">Reject</button>' + '</li>')
                })
            },
            error: function () {
                alert("error");
            }
        })
    });

    // display Request template
    $('#Request').click(function (e) {
        e.preventDefault();
        $(emails).html(
            "<label>Contact Email</label>" +
            "<input type=\"email\" id=\"contactEmail\" placeholder=\"Email\"> " + "<br />" +
            "<button class=\"btn btn-primary\" onclick = \"request()\">Send</button>"
        )

    });

    // display email compose template
    $('#Compose').click(function (e) {
        e.preventDefault();
        $(emails).html(
            "<label>Sender</label>" +
            "<input type=\"email\" id=\"from\" placeholder=\"From\"> " + "<br />" +
            "<label>Receipent</label>" +
            "<input type=\"email\" id=\"to\" placeholder=\"To\"> " + "<br />" +
            "<label>Subject</label>" +
            "<input type=\"text\" id=\"subject\" placeholder=\"Subject\"> " + "<br />" +
            "<label>Message</label>" +
            "<textarea name=\"message\" rows=\"10\" cols=\"30\" id=\"message\" placeholder=\"Enter message\"></textarea>" +
            "<button class=\"btn btn-primary\" onclick=\"sendmail()\" id=\"sendEmail\">Send</button>"
        )

    });
})

// send Email
function sendmail() {
    var $from = $('#from');
    var $to = $('#to');
    var $message = $('#message');
    var $subject = $('#subject');
    var emailData = {
        from: $from.val(),
        to: $to.val(),
        subject: $subject.val(),
        email: $message.val()
    }
    $.ajax({
        type: 'POST',
        url: '../api/email',
        data: JSON.stringify(emailData),
        contentType: "application/json",
        success: function (data) {
            if (data.error) {
                alert(data.message)
            } else {
                $(emails).html("");
                alert("Sent")
            }
        },
        error: function () {
            alert("error");
            // window.location.href = 'index.html';
        }
    })
}


// Send Request
function request() {
    var $contactEmail = $('#contactEmail');
    var requestData = {
        contactEmail: $contactEmail.val(),
    }
    $.ajax({
        type: 'POST',
        url: '../api/user/contacts',
        data: JSON.stringify(requestData),
        contentType: "application/json",
        success: function (data) {
            $(email).html("");
            alert("Requested");
        },
        error: function () {
            alert("error");
        }
    })
}
// Approve Request
function approve(id) {
    var data = {
        contactRequestId: id,
        action: "approve"
    };
    $.ajax({
        type: 'POST',
        url: '../api/user/contacts/action',
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            $(emails).html("");
            if (data.error)
                $(emails).html("<p>" + data.message + "</p>")
            else
                $(emails).html("<p>" + "Approved" + "</p>")
        },
        error: function () {
            alert("error");
        }
    })
}

// Reject Request
function reject(id) {
    var data = {
        contactRequestId: id,
        action: "reject"
    };
    $.ajax({
        type: 'POST',
        url: '../api/user/contacts/action',
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            $(emails).html("");
            if (data.error)
                $(emails).html("<p>" + data.message + "</p>")
            else
                $(emails).html("<p>" + "Rejected" + "</p>")
        },
        error: function () {
            alert("error");
        }
    })
}
// Display email content
function readMail(id) {
    $.ajax({
        type: 'GET',
        url: '../api/email/' + id + '',
        success: function (data) {
            var subject = (data.subject ? data.subject : "(NO SUBJECT)");
            // if(data.subject)
            $(emails).html("<b>Sender:</b><h4>" + data.email + "</h4><br /><b>Subject:</b><p>" + subject + "</p><br /><b>Body:</b><p>" + data.data + "</p>");
            // else 
            // $(emails).html("<b>Sender:</b><h4>" + data.email + "</h4><br /><b>Subject:</b><p>" + "(NO SUBJECT)" + "</p><br /><b>Body:</b><p>" + data.data + "</p>");
        },
        error: function () {
            alert("error");
        }
    })
}
