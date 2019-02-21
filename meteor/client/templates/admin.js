var map;
Template.admin.onCreated(function(a) {
  Session.set("userView", "admin");
  Session.set("audits", []);
  Session.set("users", []);
  Session.set("selectedTab", "profile");
});
Template.admin.onRendered(function(a) {
  var self = this;
  s = self;
  var country = $('[name="agencyProfile.country"]').val();
  Session.set("country", $('[name="agencyProfile.country"]').val());
  var bounds = Session.get("bounds");
  var newBounds = boundsString2Array(bounds);
  map = setAdminMap("adminMap", bounds);

  Tracker.autorun(function() {
    let tab = Session.get("selectedTab");
    if (tab === "profile") {
      return;
    }
    Tracker.nonreactive(function() {
      Session.set("loading", true);
      if (tab === "audit") {
        Meteor.call("getAudits", function(e, d) {
          let audits = d || [];

          Meteor.setTimeout(function() {
            Session.set("audits", audits);
            Session.set("loading");
          }, 1000);
        });
        return;
      }
      if (tab === "userData") {
        Meteor.call("getUsers", function(e, d) {
          let users = d || [];
          Meteor.setTimeout(function() {
            Session.set("users", users);
            Session.set("loading");
          }, 1000);
        });
        return;
      }
    });
  });
});
Template.admin.onDestroyed(function(a) {
  Session.set("selectedTab", "profile");
  Session.set("loading");
  Session.set("audits", []);
  Session.set("users", []);
});

Template.admin.helpers({
  roleIsChecked: function(roles, role) {
    roles = roles || [];
    var _role = roles[0];
    return _role === role ? true : false;
  },
  isTab: function(d) {
    return Session.equals(d, "selectedTab");
  },
  showAudits: function() {
    return Session.equals("selectedTab", "audit") && Session.get("audits");
  },
  logoSrc: function(event, template) {
    if (Session.get("logoSrc")) {
      return Session.get("logoSrc");
    }
  },
  hasLogo: function(event, template) {
    var config = Session.get("config") || {};
    return config.agencyLogo;
  },
  allowedStates: function() {
    var country = Session.get("country");
    var states = allowedStates(country);
    return states;
  },
  internet: function() {
    return navigator.onLine;
  },
  hasHistory: function(a, b) {
    var audits = Session.get("audits") || [];
    return audits.length ? true : false;
  },
  RecordsAudit: function(a, b) {
    var audits = Session.get("audits") || [];

    var fields = [
      {
        key: "type",
        label: "type",
        fieldId: "type"
      },
      {
        key: "userName",
        label: "userName",
        fieldId: "userName"
      },
      {
        key: "field",
        label: "field",
        fieldId: "field"
      },
      {
        key: "value",
        label: "value",
        fieldId: "value"
      },
      {
        key: "date",
        label: "date",
        fieldId: "date"
      }
    ];
    return {
      //showColumnToggles: true,
      collection: audits,
      rowsPerPage: 100,
      //showFilter: true,
      class: "table table-hover table-bordered table-condensed pointer",
      fields: fields,
      showNavigation: "auto",
      showNavigationRowsPerPage: false
    };
  },
  userAlert: function(a, b) {
    setTimeout(function() {
      $(".userAlert").fadeOut(900, function() {
        Session.set("userAlert", null);
      });
    }, 500);
    return Session.get("userAlert");
  },
  userAlertClass: function() {
    return Session.get("userAlert").error
      ? "bg-danger text-danger"
      : "bg-success text-success";
  },
  errorMessages: function() {
    return _.values(Session.get(ERRORS_KEY));
  },
  errorClass: function(key) {
    return Session.get(ERRORS_KEY)[key] && "error";
  },
  profileIncomplete: function() {
    var profileKeys = Object.keys(Session.get("agencyProfile"));
    var agencyProfile = Session.get("agencyProfile");
    var done = _.compact(
      _.map(agencyProfile, function(d) {
        return d;
      })
    );
    return done.length === profileKeys.length
      ? ""
      : "afPanel warning mar00 noBorder";
  },
  configs: function() {
    return Session.get("config");
  },
  userEmail: function() {
    return this.emails[0].address;
  },
  userRoleList: function() {
    var users = Session.get("users") || [];
    users = users.filter(function(d) {
      return d._id !== Meteor.userId();
    });
    return users.length ? users : false;
  },
  UploadImgFormData: function(a, b) {
    return {
      type: "logo"
    };
  },
  uploadLogo: function(a, b) {
    return {
      finished: function(index, fileInfo, context) {
        Meteor.call(
          "updateConfig",
          {
            agencyLogo: fileInfo.name
          },
          function(err) {
            if (err) {
              return console.log(err);
            }
            // Meteor._reload.reload();
          }
        );
      }
    };
  }
});
Template.admin.events({
  "click .adminTabs a": function(event, template) {
    let item = event.currentTarget.getAttribute("href");
    let tab = item.replace("#", "");
    Session.set("audits", []);
    Session.set("users", []);
    Session.set("selectedTab", tab);
    return true;
  },
  'change [name="agencyProfile.country"]': function(event, template) {
    return Session.set("country", event.currentTarget.value);
  },
  "click .deleteLogo": function(event, template) {
    var r = confirm("Are you sure you want to delete your custom logo?");
    if (!r) {
      return;
    }
    Meteor.call("removeLogo", function(err) {
      if (err) {
        console.log(err);
      }
    });
  },
  "click .removeUser": function(event, template) {
    var username = this.username;
    var r = confirm("Are you sure you want to delete user: " + this.username);
    var _id = this._id;
    if (r == true) {
      Meteor.call("removeUser", _id, function(err, d) {
        console.log(d);
        if (err) {
          return console.log(err);
        }
        var users = Session.get("users") || [];
        users = users.filter(function(d) {
          return d._id !== _id;
        });
        Session.set("users", users);
        Session.set("userAlert", {
          error: false,
          text: username + " Successfully Removed."
        });
      });
    } else {
      return;
    }
  },
  "click .resetPassword": function(event, template) {
    var genNewPassword = function() {
      var text = "";
      var possible = "123456789";
      for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      return text;
    };

    var r = confirm(
      "Are you sure you want to reset the password for user: " +
        this.username +
        " (" +
        this.emails[0].address +
        ")"
    );
    if (r == true) {
      var newPassword = genNewPassword();
      //var text = 'One Time Reset Password Code for ' + this.username + ' (' + this.emails[0].address + ')' + ': ' + newPassword + '\n';
      //alert(text);
      Meteor.call("setPassword", this._id, newPassword, true, function(err, d) {
        if (err) {
          console.log(err);
        } else {
          var parent = event.target.parentNode;
          event.target.remove();
          parent.innerHTML =
            '<span class="small">Send Reset Code To User<br>Reset Code:<b>' +
            newPassword +
            "</b></span>";
        }
      });
    } else {
      return;
    }
  },
  "change .adminUserRoles": function(event) {
    var user = this._id;
    var origRole = this.roles[0];
    var username = this.username;
    var val = $('input[name="role_' + user + '"]:checked').val();
    Meteor.call("changeRole", user, val, function(err) {
      if (err) {
        console.log(err);
      } else {
        Session.set("userAlert", {
          error: false,
          text:
            username +
            " Successfully Changed from " +
            origRole +
            " To " +
            val +
            "!"
        });
      }
    });
  }
});
var hooksObject = {
  onSuccess: function(insertDoc, updateDoc, currentDoc) {
    context = $(this.event.target).find('[type="submit"]');
    text = context.html();
    context.text("Saved....");
    context.delay(1000).animate(
      {
        opacity: 0
      },
      function() {
        context.html(text).animate({
          opacity: 1
        });
      }
    );
  }
};
//AutoForm.addHooks(['formIdAgencyProfile', 'formIdAgencyMap', 'formIdConfig'], hooksObject);
AutoForm.addHooks(null, hooksObject);
var setAdminMap = function(context) {
  var bounds = bounds || boundsString2Array(Session.get("bounds"));
  var map = L.map(context, {});
  var defaultLayers = Meteor.settings.public.layers;
  var layers = _.object(
    _.map(defaultLayers, function(x, e) {
      return [e, L.tileLayer(x)];
    })
  );
  var firstLayer = Object.keys(layers)[0];
  layers[firstLayer].addTo(map);
  L.control.layers(layers).addTo(map);
  map.scrollWheelZoom.disable();
  map.fitBounds(bounds);
  var lc = L.control
    .locate({
      drawCircle: false,
      markerStyle: {
        fillOpacity: 0,
        opacity: 0
      },
      onLocationError: function(err) {
        alert(err.message);
      },
      onLocationOutsideMapBounds: function(context) {
        alert(context.options.strings.outsideMapBoundsMsg);
      },
      locateOptions: {
        maxZoom: 13
      }
    })
    .addTo(map);
  var searching;
  $("#geolocate").on("click", function(e) {
    if (searching) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    $("#geolocate").html("Locating.....");
    searching = true;
    lc.start();
  });
  map.on("locationfound", function(e) {
    $("#geolocate").remove();
    $(".mapCrosshair").css("color", "#00CB00");
  });
  map.on("locationerror", function() {
    $("#geolocate").html(
      "Position could not be found - Drag map to set response area"
    );
  });
  map.on("moveend", function() {
    var bnds = map.getBounds().toBBoxString();
    $('[name="bounds"]')
      .val(bnds)
      .trigger("change");
  });
  return map;
};
