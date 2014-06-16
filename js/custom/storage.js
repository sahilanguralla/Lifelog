function post(postIndex, postDate, postTitle, postSummary, postContent) {
    this.index = postIndex;
    this.date = postDate;
    this.title = postTitle;
    this.summary = postSummary;
    this.content = postContent;
}

post.prototype.toHTML = function() {
    return '<a class="list" href="#"><div class="list-content"><span class="list-title" name="post" id="' + this.index + '">' + this.title + '</span><span class="list-subtitle"><span class="place-right">' + this.date.getHours() + ':' + this.date.getMinutes() + '</span>' + this.date.getDate() + '/' + (this.date.getMonth() + 1) + '/' + this.date.getFullYear() + '</span><span class="list-remark">' + this.summary + '</span></div></a>';
}

post.prototype.searchText = function(text) {
    if (this.title.toLowerCase().indexOf(text) != -1 || this.summary.toLowerCase().indexOf(text) != -1 || this.content.toLowerCase().indexOf(text) != -1)
        return true;
    return false;
}

post.sortPosts = function(post1, post2) {
    return post2.date - post1.date;
}

post.displayPosts = function(num, searchText) {
    document.getElementById("posts").innerHTML = post.getPosts(num, searchText);
    $.Metro.initAll();
    for (var i = 0; document.getElementsByName("post")[i] != undefined; i++) {
        document.getElementsByName("post")[i].onclick = function() {
            this.style.cursor = "pointer";
            openPost(this.id);
        }
    }
};

post.getPosts = function(num, searchText) {
    if ($.jStorage.get("pass") == "yes") {
        var password = getKey();
        if (!password) {
            password = setKey();
        }
    }
    //alert(password);
    var index = $.jStorage.index();
    if (num == undefined)
        num = index.length - 1;
    var posts = new Array();
    for (i = 2, j = 0; i <= num; i++) {
        var postDetails = $.jStorage.get(index[i]);
        postDetails = password ? Aes.Ctr.decrypt(postDetails, password, 256) : postDetails;
        postDetails = postDetails.split(";;");

        posts[j] = new post(index[i], new Date(parseInt(postDetails[0])), postDetails[1], postDetails[2], postDetails[3]);
        if (searchText == undefined)
            j++;
        else if (posts[j].searchText(searchText))
            j++;
        else
            posts.splice(j, 1);
    }

    posts.sort(post.sortPosts);

    var today = new Date();
    var yesterday = new Date(today.getTime() - 86400000);
    var time = new Date(0);
    var init = 0;
    var content;

    if (posts.length > 0) {
        content = '<div class="listview-outlook" data-role="listview">';
        for (i = 0; i < posts.length; i++) {
            if (time.toDateString() != posts[i].date.toDateString()) {
                var title;
                if (posts[i].date.toDateString() == today.toDateString())
                    title = "Today";
                else if (posts[i].date.toDateString() == yesterday.toDateString())
                    title = "Yesterday";
                else
                    title = posts[i].date.toDateString();
                content += (init ? '</div></div>' : '') + '<div class="list-group"><a href="" class="group-title">' + title + '</a><div class="group-content">';
                init++;
                time = posts[i].date;
            }
            content += posts[i].toHTML();
        }
        content += '</div></div></div>';
    } else
        content = '<div class="row"><div class="padding20 bg-darkBlue fg-white">Oops! Your diary seems to be empty. Please fill in some of your life!</div></div>';

    return content;
};

var getKey = function() {
    if ($.jStorage.get("pass") == "yes") {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].indexOf("pass=")!=-1) {
                //alert(cookies[i].indexOf("="));
                var pass = cookies[i].substring(cookies.indexOf("pass") + 6);
                //alert(pass);
                return pass;
            }
        }
    }
    return false;
};

var setKey = function() {
    if ($.jStorage.get("pass") == "yes") {
        passVal = /.{6}.*/;
        do {
            var pass = prompt("Please enter password of your Lifelog :", "Atleast 6 characters are valid...");
        } while (!passVal.test(pass));
        pass = new jsSHA(pass, "TEXT");
        pass = pass.getHash("SHA-512", "B64");
        document.cookie = "pass=" + pass;
        return pass;
    }
    return false;
};

post.setPassword = function() {
    //checking if post are password encrypted
    if ($.jStorage.get("pass") == "yes") {
        //getting password
        var password = getKey();
        //if password not entered asking user for password
        if (!password) {
            var password = setKey();
        }
    } else {
        $.jStorage.set("pass", "yes");
        var password = setKey();
    }

    //fetching posts from jStorage
    var index = $.jStorage.index();
    for (i = 2; i < index.length; i++) {
        //fetching content post by post for encryption
        var content = $.jStorage.get(index[i]);
        //decrypting (if needed) and encrypting posts
        $.jStorage.set(index[i], (password ? Aes.Ctr.decrypt(content, password, 256) : content));
    }
}

post.encrypt = function(post, password) {
    if ($.jStorage.get("pass") == "yes") {
        if(password == undefined){
            var password = getKey();
            if (!password) {
                password = setKey();
            }
        }
        var post = Aes.Ctr.encrypt(post, password, 256);
        return post;
    }
    return false;
};

post.decrypt = function(post, password) {
    if ($.jStorage.get("pass") == "yes") {
        if(password == undefined){
            var password = getKey();
            if (!password) {
                password=setKey();
            }
        }
        post = Aes.Ctr.decrypt(post, password, 256);
        return post;
    }
    return false;
};

function validate(form) {
    if (form['postTitle'].value.length == 0 || form['postSummary'].value.length == 0 || form['postContent'].value.length == 0) {
        notify("Please fill in all the fields!", "Incomplete Post", "4000", true, "red", "white");
        return false;
    }
    titleVal = /^\w+[ \.\-\w]*\w+$/;
    var count = 0;
    if (!titleVal.test(form["postTitle"].value)) {
        notify("Allowed characters are space, '.', '-' and alphanumeric!", "Invalid Title", 5000, true, "red", "white");
        return false;
    }
    return true;
}

function submitPost(form) {
    if (validate(form)) {
        var count = $.jStorage.index().length;
        var now = new Date();
        var content = now.getTime() + ";;" + form["postTitle"].value + ";;" + form["postSummary"].value + ";;" + form["postContent"].value;
        if ($.jStorage.get("pass") == "yes")
            content = post.encrypt(content);

        $.jStorage.set("post" + count, content);
        notify("Post has been succesfully added!", "Success", 5000, true, "green", "white");
        $.Dialog.close();
        post.displayPosts();
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
                '<label>Summary</label>' +
                '<div class="input-control text"><input type="text" name="postSummary" placeholder="brief it..."><button class="btn-clear"></button></div>' +
                '<label>Description</label>' +
                '<div class="input-control textarea"><textarea name="postContent" placeholder="describe it..."></textarea></div>' +
                '<div class="form-actions">' +
                '<button class="button primary">Create Post</button>&nbsp;' +
                '<button class="button" type="button" onclick="$.Dialog.close()">Cancel</button> ' +
                '</div>' +
                '</form>';
            $.Dialog.title("New Post");
            $.Dialog.content(content);
            $.Metro.initInputs();
        }
    });
}

var openPost = function(index) {
    var postDetails = $.jStorage.get(index);
    if($.jStorage.get("pass") == "yes"){
        var pass = getKey();
        if(!pass)
            pass = setKey();
        var postDetails = Aes.Ctr.decrypt(postDetails, pass, 256);
    }
    postDetails = postDetails.split(";;");
    var date = new Date(parseInt(postDetails[0]));
    $.Dialog({
        overlay: true,
        shadow: true,
        flat: true,
        draggable: false,
        icon: '<span class="icon-newspaper"></span>',
        title: 'Post View',
        content: '',
        width: 500,
        padding: 10,
        onShow: function(_dialog) {
            var content = '<h3>' + postDetails[1] + '</h3>' +
                '<small>Posted on ' + date.toGMTString() + '</small>' +
                '<hr/>' +
                '<div>' + postDetails[3] + '</div>';

            $.Dialog.content(content);
        }
    });
}

window.onload = function() {
    /*Checking Storage/
    var index=$.jStorage.index();
    for(var i=0;i<index.length;i++){
        alert(index[i]+" = "+$.jStorage.get(index[i]));
    }
    exit;*/

    //$.jStorage.flush();
    if (!($.jStorage.storageAvailable() && $.jStorage.currentBackend())) {
        notify("Please enable some storage!", "Storage Error", "10000", true, "red", "white");
        exit();
    }
    if ($.jStorage.get("user") == "" || $.jStorage.get("user") == undefined) {
        var nameVal = /^\w+\.*( \w+\.*)*$/;
        var passVal = /^.{6}.*$/;
        do {
            var name = prompt("Please enter your name :", "your name goes here...");
            if (nameVal.test(name)) {
                var requirePass = confirm("Would you like to set a password? (Note: After you set password all of your data will be encrypted. This password will be asked from you at start of every session.)");
                if(requirePass){
                    do {
                        if (pass != undefined)
                            alert("Please input atleast 6 characters of password!");
                        var pass = prompt("Please set a password for your Lifelog :", "Atleast 6 characters are required...");
                    } while (!passVal.test(pass));
                }
                break;
            }
            alert("Invalid name entered! Please retry!")
        } while (1);
        if (requirePass) {
            //alert(pass);
            pass = new jsSHA(pass, "TEXT");
            pass = pass.getHash("SHA-512", "B64");
            //alert(name);
            name = Aes.Ctr.encrypt(name, pass, 256);
            //alert(pass);
        }
        $.jStorage.set("user", name);
        //name = Aes.Ctr.decrypt($.jStorage.get('user'), pass, 256);
        //alert(name);

        $.jStorage.set("pass", (requirePass ? "yes" : "no"));
        document.cookie = requirePass ? ("pass=" + pass) : null;

        var firstPost = confirm("Would you like to post your first post now?");
        if (firstPost)
            newPostBox();
    } else {
        var name = $.jStorage.get("user");
        if($.jStorage.get("pass") == "yes"){
            var pass = getKey();
            if(!pass)
                pass = setKey();
            name = Aes.Ctr.decrypt(name, pass, 256);
        } 
        notify("Welcome back <b>" + name + "</b>", "", 3000, true, "green", "white");
    }

    post.displayPosts();

    document.getElementById("search").onkeyup = function() {
        post.displayPosts(undefined, this.value);
    };
};
