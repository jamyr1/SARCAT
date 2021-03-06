var ERRORS_KEY = 'signinErrors';
Template.adminSetup.created = function () {
    Session.set(ERRORS_KEY, {});
};
Template.adminSetup.helpers({
    errorMessages: function () {
        return _.values(Session.get(ERRORS_KEY));
    },
    errorClass: function (key) {
        return Session.get(ERRORS_KEY)[key] && 'error';
    },
});
Template.adminSetup.events({
    'submit': function (event, template) {
        var self = this;
        event.preventDefault();
        var email = template.$('[name=email]')
            .val();
        var password = template.$('[name=password]')
            .val();
        var errors = {};
        if (!email) {
            errors.email = 'Email is required';
        }
        if (!password) {
            errors.password = 'Password is required';
        }
        Session.set(ERRORS_KEY, errors);
        if (_.keys(errors)
            .length) {
            return;
        }
        var _id = Meteor.userId();
        event.preventDefault();
        var firstname = template.$('[name=firstname]')
            .val();
        var lastname = template.$('[name=lastname]')
            .val();
  
        var confirm = template.$('[name=confirm]')
            .val();

        if (!firstname) {
            errors.firstname = 'First Name required';
        }
        if (!lastname) {
            errors.lastname = 'Last Name required';
        }
        if (!email) {
            errors.email = 'Email required';
        }
        if (!password) {
            errors.password = 'Password required';
        }
        if (confirm !== password) {
            errors.confirm = 'Please confirm your password';
        }
        Session.set(ERRORS_KEY, errors);
        if (_.keys(errors)
            .length) {
            return;
        }
        var username = [firstname, lastname].join(' ');
        console.log(username, email, password);
        Meteor.call('createAdmin', username, email, password, function () {
            Meteor.loginWithPassword(email, password, function () {
                Meteor.call('removeUser', _id);
                Router.go('home', Meteor.user());
            });
        });
    }
});

