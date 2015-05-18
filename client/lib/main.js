flatten = function (x, result, prefix) {
    if (_.isObject(x)) {
        _.each(x, function (v, k) {
            flatten(v, result, prefix ? prefix + '.' + k : k)
        })
    } else {
        result[prefix] = x
    }
    return result
}
labelUnits = function (currentUnit, type) {
    var unitType = {
        height: {
            Metric: 'cm',
            US: 'in'
        },
        weight: {
            Metric: 'kg',
            US: 'lbs'
        },
        distanceMed: {
            Metric: 'Meters',
            US: 'Yards'
        },
        distanceSmall: {
            Metric: 'Meters',
            US: 'Feet'
        },
        distance: {
            Metric: 'Kilometers',
            US: 'Miles'
        },
        distanceSmall: {
            Metric: 'Meters',
            US: 'Feet'
        },
        temperature: {
            Metric: '°C',
            US: '°F'
        },
        speed: {
            Metric: 'kph',
            US: 'mph'
        }
    };
    return unitType[type][currentUnit]
};
boundsString2Array = function (bounds) {
    if (!bounds) {
        return;
    }
    bounds = bounds.split(',')
        .map(function (d) {
            return +d;
        });
    return [
        [bounds[1], bounds[0]],
        [bounds[3], bounds[2]]
    ];
};
newMap = function (context, bounds) {
    var bounds = bounds || boundsString2Array(Session.get('bounds'));
    var map = L.map(context, {});
    var defaultLayers = Meteor.settings.public.layers;
    var layers = _.object(_.map(defaultLayers, function (x, e) {
        return [e, L.tileLayer(x)];
    }));
    var firstLayer = Object.keys(layers)[0];
    layers[firstLayer].addTo(map);
    L.control.layers(layers)
        .addTo(map);
    map.scrollWheelZoom.disable();
    map.fitBounds(bounds);
};
setAdminMap = function (context) {
    var bounds = bounds || boundsString2Array(Session.get('bounds'));
    var map = L.map(context, {});
    var defaultLayers = Meteor.settings.public.layers;
    var layers = _.object(_.map(defaultLayers, function (x, e) {
        return [e, L.tileLayer(x)];
    }));
    var firstLayer = Object.keys(layers)[0];
    layers[firstLayer].addTo(map);
    L.control.layers(layers)
        .addTo(map);
    map.scrollWheelZoom.disable();
    map.fitBounds(bounds);
    var lc = L.control.locate({
            drawCircle: false,
            markerStyle: {
                fillOpacity: 0,
                opacity: 0
            },
            onLocationError: function (err) {
                alert(err.message);
            },
            onLocationOutsideMapBounds: function (context) {
                alert(context.options.strings.outsideMapBoundsMsg);
            },
            locateOptions: {
                maxZoom: 13,
            }
        })
        .addTo(map);
    var searching;
    if (!navigator.geolocation) {
        $('#geolocate')
            .html('Geolocation is not available');
    } else {
        geolocate.onclick = function (e) {
            if (searching) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            $('#geolocate')
                .html('Locating.....');
            searching = true;
            lc.start();
        };
    }
    map.on('locationfound', function (e) {
        $('#geolocate')
            .remove();
        $('.mapCrosshair')
            .css('color', '#00CB00');
    });
    map.on('locationerror', function () {
        $('#geolocate')
            .html('Position could not be found - Drag map to set extent');
    });
    map.on('moveend', function () {
        var bnds = map.getBounds()
            .toBBoxString();
        $('[name="bounds"]')
            .val(bnds)
            .trigger("change");
    });
    return map;
}
newProjectSetMap = function (context, bounds, points) {
    var obj = {};
    var marker;
    var map = L.map(context, {});
    var defaultLayers = Meteor.settings.public.layers;
    var layers = _.object(_.map(defaultLayers, function (x, e) {
        return [e, L.tileLayer(x)];
    }));
    var firstLayer = Object.keys(layers)[0];
    layers[firstLayer].addTo(map);
    L.control.layers(layers)
        .addTo(map);
    var latLngBounds = L.latLngBounds(bounds);
    var center = latLngBounds.getCenter();
    obj.editPoint = function (lat, lng) {
        marker.setLatLng([lat, lng]);
    };
    obj.reset = function () {
        map.fitBounds(bounds);
        marker.setLatLng(center);
        $('[name="' + points.name + '.lng"]')
            .val(center.lng)
            .trigger("change");
        $('[name="' + points.name + '.lat"]')
            .val(center.lat)
            .trigger("change");
        $('[name="coords.bounds"]')
            .val(bounds.toString())
            .trigger("change");
    };
    map.scrollWheelZoom.disable();
    var ipp = {
        val: "ippCoordinates",
        name: "coords.ippCoordinates",
        text: 'IPP Location. <br>Direction of Travel (hover to edit): <div class="fa fa-arrow-circle-up fa-2x fa-fw travelDirection"></div>', //"IPP Location",
        icon: 'fa-times-circle-o',
        color: 'red'
    };
    var myIcon = L.AwesomeMarkers.icon({
        icon: ipp.icon,
        prefix: 'fa',
        markerColor: ipp.color,
        iconColor: '#fff',
    });
    var marker = L.marker(center, {
        draggable: true,
        icon: L.AwesomeMarkers.icon({
            icon: ipp.icon,
            prefix: 'fa',
            markerColor: ipp.color,
            iconColor: '#fff',
        }),
        name: ipp.name,
        val: ipp.val,
    });
    marker.addTo(map);
    marker.on('dragend', function (event) {
        var marker = event.target;
        var position = marker.getLatLng();
        $('[name="' + points.name + '.lng"]')
            .val(position.lng)
            .trigger("change");
        $('[name="' + points.name + '.lat"]')
            .val(position.lat)
            .trigger("change");
    });
    return obj;
};
getCoords = function (record) {
    var mapPoints = [{
        val: "ippCoordinates",
        name: "coords.ippCoordinates",
        text: 'IPP Location. <br>Direction of Travel (hover to edit): <div class="fa fa-arrow-circle-up fa-2x fa-fw travelDirection"></div>', //"IPP Location",
        icon: 'fa-times-circle-o',
        color: 'red'
    }, {
        val: "decisionPointCoord",
        name: "coords.decisionPointCoord",
        text: "Decision Point",
        icon: 'fa-code-fork',
        color: 'orange'
    }, {
        val: "destinationCoord",
        name: "coords.destinationCoord",
        text: "Intended Destination",
        icon: 'fa-flag-checkered',
        color: 'blue'
    }, {
        val: "revisedLKP_PLS",
        name: "coords.revisedLKP_PLS",
        text: "Revised IPP",
        icon: 'fa-times-circle-o',
        color: 'red',
        extraClasses: 'Rev'
    }, {
        val: "findCoord",
        name: "coords.findCoord",
        text: "Find Location",
        icon: 'fa-flag-checkered',
        color: 'green'
    }, {
        val: "intendedRoute",
        name: "coords.intendedRoute",
        text: "Intended Route",
        path: {
            stroke: '#37A8DA'
        }
    }, {
        val: "actualRoute",
        name: "coords.actualRoute",
        text: "Actual Route",
        path: {
            stroke: 'green',
            weight: 8
        }
    }];
    mapPoints = _.object(_.map(mapPoints, function (x) {
        return [x.val, x];
    }));
    if (!record.coords) {
        return mapPoints;
    }
    var coords = record.coords;
    _.each(mapPoints, function (d, e) {
        mapPoints[e].coords = coords[e];
    });
    return _.map(mapPoints, function (d) {
        return d;
    });
};
formSetMap = function (context, recordId) {
    var markers = {};
    var paths = {};
    var coords = {};
    var obj = {};
    var map = L.map(context);
    var units = (Session.get('measureUnits') === 'Metric') ? true : false;
    L.Control.measureControl({
            metric: units
        })
        .addTo(map);
    var defaultLayers = Meteor.settings.public.layers;
    var layers = _.object(_.map(defaultLayers, function (x, e) {
        return [e, L.tileLayer(x)];
    }));
    var firstLayer = Object.keys(layers)[0];
    layers[firstLayer].addTo(map);
    L.control.layers(layers)
        .addTo(map);
    var bounds = boundsString2Array(Session.get('bounds'));
    map.fitBounds(bounds);
    console.log('fitbounds')
    drawnPaths = new L.FeatureGroup()
        //.addTo(map);
    drawnPoints = new L.FeatureGroup()
        //.addTo(map);
    map.scrollWheelZoom.disable();
    map.on('moveend', function () {
        var bounds = map.getBounds()
            .toBBoxString();
        $('[name="coords.bounds"]')
            .val(bounds)
            .trigger("change");
    });
    obj.add = function (d) {
        var val = d.val;
        if (!d.path) {
            coords[val] = d;
            obj.addPoint(d);
        }
        if (val === 'intendedRoute' || val === 'actualRoute') {
            coords[d.val] = d;
            if (d.coords) {
                obj.addPoly(d, JSON.parse(d.coords));
                return;
            }
            var start = coords.ippCoordinates.layer.getLatLng();
            var end;
            var dest = (val === 'intendedRoute') ? 'destinationCoord' : 'findCoord';
            if (coords[dest]) {
                end = coords[dest].layer.getLatLng()
            } else {
                var ne = map.getBounds()
                    ._northEast;
                var center = map.getCenter();
                end = {
                    lat: center.lat,
                    lng: (center.lng + (ne.lng - center.lng) / 2)
                }
            }
            var latlngs = [
                [start.lat, start.lng],
                [end.lat, end.lng]
            ];
            obj.addPoly(d, latlngs);
        }
    };
    obj.remove = function (d) {
        if (d.path) {
            obj.removePoly(d);
        } else {
            obj.removePoint(d);
            return;
        }
    };
    obj.addPoly = function (d, latlngs) {
        color = d.path.stroke;
        var polyline = L.polyline(latlngs, {
            color: color,
            opacity: 0.9,
            name: d.name,
            val: d.val,
            //editable: true
        });
        drawnPaths.addLayer(polyline);
        marker.setZIndexOffset(4);
        coords[d.val].layer = polyline;
        var lineString = JSON.stringify(latlngs);
        $('[name="' + d.name + '"]')
            .val(lineString)
            .trigger("change");
        polyline.on('click', function (d) {
            polyline.editing.enable();
        });
        polyline.on('dblclick', function (d) {
            polyline.editing.disable();
        });
        $('#formMap')
            .on('mouseup', '.leaflet-editing-icon', function (d) {
                drawnPaths.eachLayer(function (layer) {
                    var name = layer.options.name;
                    if (layer._path) {
                        latlngs = layer.getLatLngs()
                            .map(function (d) {
                                return [d.lat, d.lng]
                            });
                        var lineString = JSON.stringify(latlngs);
                        $('[name="' + name + '"]')
                            .val(lineString)
                            .trigger("change");
                        return;
                    }
                });
            })
            //var lineString = JSON.stringify(layer.toGeoJSON());
    };
    obj.removePoly = function (d) {
        var path = coords[d.val].layer;
        $('[name="' + d.name + '"]')
            .val('')
            .trigger("change");
        drawnPaths.removeLayer(path);
        delete coords[d.val];
    };
    obj.removePoint = function (d) {
        var marker = coords[d.val].layer;
        if (!marker) {
            return;
        }
        $('[name="' + d.name + '.lng"]')
            .val('')
            .trigger("change");
        $('[name="' + d.name + '.lat"]')
            .val('')
            .trigger("change");
        drawnPoints.removeLayer(marker);
        delete coords[d.val];
    };
    obj.editPoint = function (name) {
        var coords = Records.findOne(recordId)
            .coords[name];
        var layer = drawnPoints.getLayers()
            .filter(function (d) {
                return d.options.name === 'coords.' + name;
            });
        if (!layer.length) {
            return;
        }
        layer[0].setLatLng([coords.lat, coords.lng]);
        obj.fitBounds();
    };
    obj.addPoint = function (d) {
        var _coords = d.coords; // || map.getCenter();
        if (!d.coords) {
            var ne = map.getBounds()
                ._northEast;
            var center = map.getCenter();
            _coords = {
                lat: center.lat,
                lng: (center.lng + (ne.lng - center.lng) / 2)
            }
        }
        var myIcon = L.AwesomeMarkers.icon({
            icon: d.icon,
            prefix: 'fa',
            markerColor: d.color,
            iconColor: '#fff',
            extraClasses: d.extraClasses
        });
        var draggable = (Roles.userIsInRole(Meteor.userId(), ['editor', 'admin'])) ? true : false;
        marker = L.marker(_coords, {
            draggable: draggable,
            icon: myIcon,
            name: d.name,
            val: d.val,
        });
        var text = d.text;
        coords[d.val].layer = marker;
        drawnPoints.addLayer(marker);
        $('[name="' + d.name + '.lng"]')
            .val(_coords.lng)
            .trigger("change");
        $('[name="' + d.name + '.lat"]')
            .val(_coords.lat)
            .trigger("change");
        marker.on('dragend', function (event) {
            var marker = event.target;
            var position = marker.getLatLng();
            Meteor.call('updateRecord', recordId, d.name, position, function (err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
            });
        });
        return marker;
    }
    obj.fitBounds = function () {
        map.fitBounds(drawnPoints.getBounds()
            .pad(0.5));
        m = map
        drawnPaths.addTo(map);
        drawnPoints.addTo(map);
        return
        if (Object.keys(coords)
            .length < 2) {
            map.setZoom(9)
        }
    };
    return obj;
}
insertSampleRecords = function () {
    function randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    data = [];
    var length = 200;

    for (var i = 0; i < length; i++) {
        var record = {
            "_id": "xFDAz8MF6wvKY6sdu",
            "coords": {
                "ippCoordinates": {
                    "lat": 38.96331304643642,
                    "lng": -77.12870121002197
                },
                "findCoord": {
                    "lat": 38.953201586850895,
                    "lng": -77.16290473937988
                },
                "destinationCoord": {
                    "lat": 38.95019790508175,
                    "lng": -77.14264869689941
                },
                "intendedRoute": "[[38.96331304643642,-77.12870121002197],[38.959942720227495,-77.09814548492432]]",
                "actualRoute": "[[38.96331304643642,-77.12870121002197],[38.953201586850895,-77.16290473937988]]",
                "decisionPointCoord": {
                    "lat": 38.956805836944525,
                    "lng": -77.14513778686523
                },
                "revisedLKP_PLS": {
                    "lat": 38.95580467475027,
                    "lng": -77.1265983581543
                }
            },
            "recordInfo": {
                "name": "1",
                //"incidentnum": "_1",
                // "missionnum": "_1",
                "incidentType": "Search",
                "incidentEnvironment": "Land",
                "subjectCategory": "ATV",
                "status": "Closed"
            },
            "measureUnits": "US",
            "userId": "cYPBpNKhviSp4yjJQ",
            "created": "05/15/2015 07:42",
            "incidentOperations": {
                "initialDirectionofTravel_Boolean": "Yes",
                "lkp_pls_Boolean": "Yes",
                "ipptype": "Point Last Seen",
                "ippclassification": "Road",
                "DOTHowdetermined": "Sighting",
                "typeofDecisionPoint": "Shortcut",
                "decisionPointFactor": "Yes",
                "initialDirectionofTravel": 161
            },
            "incidentLocation": {
                "country": "United States",
                "state-province": "Virginia",
                "ecoregionDomain": "TEMPERATE",
                "ecoregionDivision": "230-SUBTROPICAL DIVISION",
                "county-region": "Fairfax",
                "landOwner": "Commercial",
                "populationDensity": "Suburban",
                "terrain": "Hilly",
                "landCover": "Light"
            },
            "incident": {
                "leadagency": "Fairfax County Police",
                "contactmethod": "Reported Missing"
            },
            "weather": {},
            "findLocation": {
                "distanceIPP": "1.97",
                "findBearing": "249",
                "elevationChange": "-49",
                "dispersionAngle": "88",
                "findFeature": "Road",
                "detectability": "Excellent",
                "trackOffset": "20"
            },
            "incidentOutcome": {
                "incidentOutcome": "Closed by Search",
                "scenario": "Lost",
                "signalling": "PLB",
                "lostStrategy": "Stayed put",
                "mobility&Responsiveness": "Mobile and responsive",
                "injuredSearcher": "Yes",
                "mobility_hours": 20
            },
            "subjects": {
                "subject": [{
                    "_key": "2015-05-15T15:05:50.038Z",
                    "age": 10,
                    "sex": "Male",
                    "status": "Alive and well"
                }, {
                    "_key": "2015-05-15T15:05:52.234Z",
                    "age": 18,
                    "sex": "Female",
                    "status": "Injured"
                }, {
                    "_key": "2015-05-15T15:05:54.294Z",
                    "age": 30,
                    "sex": "Female",
                    "status": "DOA"
                }]
            },
            "resourcesUsed": {
                "resource": [{
                    "_key": "2015-05-15T15:29:57.046Z",
                    "type": "Bike",
                    "count": 9,
                    "hours": 27,
                    "findResource": true
                }, {
                    "_key": "2015-05-15T15:30:00.667Z",
                    "type": "Helicopter",
                    "count": 2,
                    "hours": 6
                }],
                "numTasks": 32,
                "totalPersonnel": 565,
                "totalManHours": 3045,
                "distanceTraveled": "3421",
                "totalCost": "1000500"
            },
            "customQuestions": {},
            "admin": {
                "userId": "cYPBpNKhviSp4yjJQ",
                "user": "Kyle K",
                "email": "admin@sarcat",
                "phonenum": "7036290113"
            },
            "timeLog": {
                "SARNotifiedDatetime": "05/04/2015 09:21",
                "incidentClosedDateTime": "05/05/2015 09:21",
                "totalSearchHours": 96,
                "totalMissingHours": 130,
                "subjectLocatedDateTime": "05/05/2015 11:03",
                "lastSeenDateTime": "05/01/2015 11:03"
            },
            "xComments": {
                "summary": "Good Search!"
            }
        };
        delete record._id;
        delete record.created;
        //delete recordInfo.incidentnum;
        record.created = moment(randomDate(new Date(2012, 0, 1), new Date()))
            .format('MM/DD/YYYY HH:mm');
        record.timeLog.lastSeenDateTime = record.created;
        record.timeLog.SARNotifiedDatetime = moment(record.timeLog.lastSeenDateTime).add(Math.floor(Math.random() * 40), 'h').format('MM/DD/YYYY HH:mm');
        record.timeLog.subjectLocatedDateTime = moment(record.timeLog.SARNotifiedDatetime).add(Math.floor(Math.random() * 6), 'd').format('MM/DD/YYYY HH:mm');
        record.timeLog.incidentClosedDateTime = moment(record.timeLog.subjectLocatedDateTime).add(Math.floor(Math.random() * 10), 'h').format('MM/DD/YYYY HH:mm');
        //console.log(Schemas)
        _.each(record, function (d, name) {
            if (!isNaN(d)) {
                d=500;
                record[name] = Math.floor(Math.abs((Math.random() * ((d*2) - (d/5)) + (d/5))))
            }
            if (_.isObject(d)) {
                _.each(d, function (e, name2) {
                    if (!isNaN(e)) {
                        e=500;
                        record[name][name2] = Math.floor(Math.abs((Math.random() * ((e*2) - (e/5)) + (e/5))))
                    }
                    var allowed = Schemas[name]._schema[name2].allowedValues;
                    if (allowed) {
                        var sample = _.sample(allowed, 1)[0];
                        record[name][name2] = sample;
                    }
                });
            }
            record.recordInfo.name = 'Record-' + i;
            record.recordInfo.incidentnum = 'inc-' + i;
            record.recordInfo.missionnum = '#2015' + i;
        });
        _.each(record.subjects.subject, function (e, ind) {
            _.each(e, function (d, name) {
                var allowed = Schemas.subjects._schema['subject.$.' + name].allowedValues;
                if (allowed) {
                    var sample = _.sample(allowed, 1)[0];
                    // console.log(record.subjects.subject[ind][name],sample)
                    record.subjects.subject[ind][name] = sample;
                }
            });
            e.age = Math.floor(Math.random() * 70) + 1;
        });
        var lat = +(Math.random() * (38.800 - 38.2200) + 38.2200)
            .toFixed(4);
        var lng = -(Math.random() * (77.950 - 77.310) + 77.310)
            .toFixed(4);
        record.coords.ippCoordinates.lat = lat;
        record.coords.ippCoordinates.lng = lng;
        _.each(record.coords, function (d, name) {
            if (name === 'ippCoordinates') {
                return;
            }
            if (d.lat) {
                d.lat = lat + parseFloat((Math.random() * (0.100 - (-0.1)) + (-0.1))
                    .toFixed(4));
                d.lng = lng + parseFloat((Math.random() * (0.100 - (-0.1)) + (-0.1))
                    .toFixed(4));
            }
        })
        data[i] = record;
        //console.log(record.recordInfo.name)
    }
    data.forEach(function (d) {
        //console.log(d.recordInfo.name)
             Records.insert(d);
    })
};