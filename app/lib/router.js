Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context);
});
Handlebars.registerHelper('isEqual', function (a, b) {
    return a === b;
});

Router.configure({
    layoutTemplate: 'appBody',
    notFoundTemplate: 'appNotFound',
    loadingTemplate: 'appLoading',
    waitOn: function () {
        return [
            Meteor.subscribe('publicLists'),
            Meteor.subscribe('userData'),
            Meteor.subscribe('config'),
            Meteor.subscribe('roles'),
        ];
    },
    onBeforeAction: function () {
        if (Config.findOne({
                initSetup: true
            })) {
            Router.go('adminSetup');
        }
        this.next();
    },
    action: function () {
        if (this.ready()) {
            this.render();
        } else {
            this.render('appLoading');
        }
    }
});

Router.route('home', {
    path: '/',
    action: function () {

        if (Meteor.user()) {

            if (Roles.userIsInRole(Meteor.userId(), ['admin'])) {

                Router.go('admin');
            } else {
                Router.go('records', Meteor.user());
            }

        } else {
            Router.go('signin');
        }
    }
});
Router.route('adminSetup', {
    path: '/adminSetup/',
    layoutTemplate: null,
    onBeforeAction: function () {
        this.next();
    }
});
Router.route('join');
Router.route('signin');
/*
Router.route('user-home', {
    path: '/user/:_id',
    data: function () {
        var obj = {};
        //obj.user = Meteor.user();
        obj.users = Meteor.users.find().fetch();
        obj.records = Records.find();
        return obj;
    },
});
*/

Router.route('records', {
    path: '/records',
    waitOn: function () {
        return [this.subscribe('publicLists')];
    },
    data: function () {
        var obj = {};
        //obj.user = Meteor.user();
        obj.users = Meteor.users.find();
        obj.records = Records.find();
        return obj;
    },

    action: function () {
        if (this.ready()) {
            this.render();
        }
    }
});

Router.route('admin', {
    path: '/admin',
    waitOn: function () {
        return this.subscribe('userData');
    },
    data: function () {
        var obj = {};
        obj.users = Meteor.users.find();
        obj.records = Records.find();
        return obj;
    },

    action: function () {

        if (this.ready()) {
            this.render();
        }
    }
});
/*
Router.route('admin', {
    path: '/admin',
    waitOn: function () {
        return this.subscribe('userData');
    },
    data: function () {
        var obj = {};
        //obj.user = Meteor.user();
        obj.users = Meteor.users.find();
        obj.records = Records.find();
        console.log(obj)
        return obj;
    },

    action: function () {
        if (this.ready()) {
            this.render();
        }
    }
});*/
Router.route('profiles');
Router.route('form', {
    path: '/form/:_id',
    waitOn: function () {
        return this.subscribe('item', this.params._id);
    },
    data: function () {
        var obj = {};
        obj.record = Records.findOne(this.params._id);
        return obj;
    },
    action: function () {
        if (this.ready()) {
            this.render();
        }
    }
});
//});
/*
meteor add insecure
meteor add autopublish
meteor remove insecure
meteor remove autopublish
*/
