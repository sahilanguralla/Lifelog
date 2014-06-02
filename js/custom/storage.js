function post(postDate, postTitle, postContent) {
    this.date = postDate;
    this.title = postTitle;
    this.content = postContent;
}

function validate(form) {
    if (form['postTitle'].value.length == 0 || form['postDate'].value.length == 0 || form['postContent'].value.length == 0) {
        notify("Please fill in all the fields!", "Incomplete Post", "4000", true, "red", "white");
        return false;
    }
    titleVal = /^\w+[ \.\-\w]*\w+$/;
    dateVal = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    var count = 0;
    if (!titleVal.test(form["postTitle"].value)) {
        notify("Allowed characters are space, '.', '-' and alphanumeric!", "Invalid Title", 5000, true, "red", "white");
        count++;
    }
    if (!dateVal.test(form["postDate"].value)) {
        notify("Valid Format of date is MM/DD/YYYY!", "Invalid Date", "6000", true, "red", "white");
        count++;
    }
    if (count != 0)
        return false;
    return true;
}

function submitPost(form) {
    if (validate(form)) {
        var count = $.jStorage.index().length;
        $.jStorage.set("post" + count, form["postDate"].value + ";;" + form["postTitle"].value + ";;" + form["postContent"].value);
        notify("Post has been succesfully added!", "Success", 5000, true, "green", "white");
    }
    return false;
}

var notify = function(note, cptn, tout, shdw, bg, fg, ht, wd) {
    if (tout == undefined || tout == 0)
        tout = 1000;
    if (cptn == undefined)
        cptn = "";
    if (shdw == undefined || shdw == "")
        shdw = true;
    if (bg == undefined || bg == "")
        bg = "white";
    if (fg == undefined || fg == "")
        fg = "black";
    if (ht == undefined)
        ht = "auto";
    if (wd == undefined)
        wd = "auto";

    var not = $.Notify({
        style: {
            background: bg,
            color: fg
        },
        caption: cptn,
        shadow: shdw,
        content: note,
        height: ht,
        width: wd,
        timeout: tout
    });
}

var newPostBox = function() {
    $.Dialog({
        overlay: true,
        shadow: true,
        flat: true,
        draggable: false,
        icon: '<span class="icon-file-xml"></span>',
        title: 'New Post',
        content: '',
        width: 500,
        padding: 10,
        onShow: function(_dialog) {
            var content = '<form class="user-input" id="postForm" onsubmit="submitPost(this);return false;">' +
                '<label>Post Title</label>' +
                '<div class="input-control text"><input type="text" name="postTitle" placeHolder="a suitable title..."><button class="btn-clear"></button></div>' +
                '<label>Date</label>' +
                '<div class="input-control text"><input type="text" name="postDate" placeholder="MM/DD/YYYY"><button class="btn-clear"></button></div>' +
                '<label>Description</label>' +
                '<div class="input-control textarea"><textarea name="postContent" placeholder="describe it..."></textarea></div>' +
                '<div class="form-actions">' +
                '<button class="button primary">Create Post</button>&nbsp;' +
                '<button class="button" type="button" onclick="$.Dialog.close()">Cancel</button> ' +
                '</div>' +
                '</form>';
            $.Dialog.title("New Post");
            $.Dialog.content(content);
        }
    });
}

window.onload = function() {
    if (!($.jStorage.storageAvailable() && $.jStorage.currentBackend())) {
        notify("Please enable some storage!", "Storage Error", "10000", true, "red", "white");
        exit();
    }
    if ($.jStorage.get("user") == "" || $.jStorage.get("user") == undefined) {
        var nameVal = /^\w+\.*( \w+\.*)*$/;
        do {
            var name = prompt("Please enter your name :", "your name goes here...");
            if (nameVal.test(name))
                break;
            alert("Invalid name entered! Please retry!")
        } while (1);
        $.jStorage.set("user", name);
        var firstPost = confirm("Would you like to post your first post now?");
        if (firstPost)
            newPostBox();
    } else {
        notify("Welcome back <b>" + $.jStorage.get("user") + "</b>", "", 3000, true, "green", "white");
    }
    var index = $.jStorage.index();
    var posts = new Array();
    for (i = 1; i < index.length; i++) {
        var postDetails = $.jStorage.get(index[i]).split(";;");
        posts[i - 1] = new post(new Date(postDetails[0]), postDetails[1], postDetails[2]);
    }

    posts.sort(function(post1, post2) {
        return post2.date - post1.date;
    });

    for (i = 0; i < posts.length; i++) {
        document.getElementById("posts").innerHTML += '<div class="row padding10">\n      <div class="span12" style="background-color:#EEEEEE;padding-left:20px">\n        <div class="row">\n          <div class="span8">\n            <h3>' + posts[i].title + '</h3>\n          </div>\n          <div class="span3 text-right">\n            <h4>' + posts[i].date.getDate() + '/' + posts[i].date.getMonth() + '/' + posts[i].date.getFullYear() + '</h4>\n          </div>\n        </div>\n        <div class="row">\n          <p>' + posts[i].content + '</p>\n        </div>\n      </div>\n    </div>';
    }
}
