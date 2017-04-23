$(document).ready(init);

var map;
var db;

function init() {
    document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {

    openDb();  

    $("#recipes-list, #videos-list").on("click", function(e){
       
       if(e.target.attributes["data-id"] += undefined){
            if(!$(e.target).hasClass('color-red-light')) {
                $(e.target).addClass('color-red-light');
            } else {
                $(e.target).removeClass('color-red-light');
            }
       }
    });


    $("#back").on("click", function(e){
        e.preventDefault();
        javascript:history.back();
    });

    if(window.location.href.indexOf("index.html") > -1) { 
        displayRecipes();  
    }

    if(window.location.href.indexOf("videos.html") > -1) { 
        displayVideos();  
    }    

    if(window.location.href.indexOf("restaurants.html") > -1) { 
        showMaps();  
    }  

    if(window.location.href.indexOf("scan-item.html") > -1) {
        if(!sessionStorage.productName) {
            $("#header-item-name").append().text("Product Name");
        } else {

                 $("#header-item-name").append().text(sessionStorage.productName);

                $.getJSON("https://rebp.nl/json/products.json", function(data) {

                      data.data.forEach(function(val) {


                        if( val.name == sessionStorage.productName){

                            $("#carbs").append().text("Carbs: "+val.nutrition_fatcs.carbs);
                            $("#fat").append().text("Fat: "+val.nutrition_fatcs.fat);
                            $("#protein").append().text("Protein: "+val.nutrition_fatcs.protein);
                            $("#calories").append().text("Calories: "+val.nutrition_fatcs.calories);

                            var output = "";

                            $.each(val.recipes, function(i, val){

                                    output += "<div class='portfolio-item'>";
                                    output += "<img class='preload-image responsive-image' src='"+val.image_href+"' alt='img'>";
                                    output += "<p class='center-text'>"+val.description+"</p>";
                                    output += "<a href='"+val.link+"' target='_blank' class='adaptive-more center-text'>Preparation<i class='fa fa-long-arrow-right'></i></a>";
                                    output += "</div>";                                
                            }); 

                            $("#recommended-recipes").append().html(output);                                       
                        }

                      });
                });
            
        }       
    }

    if(window.location.href.indexOf("scan.html") > -1) {

        $("#scan").on('click', openScan); 

        savedScans();


        $("#scans").on('click', function(e){
            e.preventDefault();
            var target = e.target.lastChild.data;
            sessionStorage.productName = target;
            window.location.href = "scan-item.html";
        }); 
    }

    $("#clearDb").on("click", dropDb);


}

function displayVideos() {
    $.getJSON("https://rebp.nl/json/videos.json", function(recipe) {

        var output = "";

          recipe.data.forEach(function(val) {

            output += "<h3>"+val.description+"</h3>";
            output += "<div class='responsive-video full-bottom'>";
            output += "<iframe src='"+val.link+"'></iframe>";
            output += "</div>";
            output += "<a href='#' class='button button-ghost button-red'><i data-id='"+val.id+"' class='fa fa-heart'></i></a>"
            output += "<div class='decoration'></div>";

          });

          $("#videos-list").append().html(output);
    });     
}

function displayRecipes() {
    $.getJSON("https://rebp.nl/json/recipes.json", function(recipe) {

        var output = "";

          recipe.data.forEach(function(val) {

            output += "<div class='portfolio-item'>";
            output += "<img class='preload-image responsive-image' src='"+val.image_href+"' alt='img'>";
            output += "<h1>"+val.description+"</h1>";
            output += "<a href='#' class='button button-ghost button-red'><i data-id='"+val.id+"' class='fa fa-heart'></i></a>"
            output += "<a href='"+val.link+"' class='button button-ghost button-blue float-right'>Preparation</a>";
            output += "</div>";
            output += "<div class='decoration'></div>";

          });

          $("#recipes-list").append().html(output);
    });    
}

function openDb() {
    db = window.sqlitePlugin.openDatabase(
        // options
        {
          name: "govegan",
          location: 1 
        },
        // success callback
        function (msg) {
          //alert(JSON.stringify(msg));
          return null;
        },
        // error callback
        function (msg) {
          alert("error: " + msg);
        }
    );
}

function dropDb() {
    db.transaction(function(tx) {
      tx.executeSql(
        'DROP TABLE scans',
        [],
        function(tx, res) {
          alert('Table deleted');
          savedScans();
        },
        // note: gets called when deleting table without having inserted rows,
        //       to avoid this error use: 'DROP TABLE IF EXISTS test'
        function(tx, res) {
          alert('error: ' + res.message);
        }
      );
    });    
}

function openScan(e) {
    e.preventDefault();
    cordova.plugins.barcodeScanner.scan(
        // success callback function
        function (result) {

            db.transaction(function(tx) {
                tx.executeSql(
                    "SELECT * FROM scans;",
                    [],
                    function(tx, res){
                        for (var i=0; i<res.rows.length; i++) {
                            var row = res.rows.item(i); 

                            if(row.data == result.text) {
                                navigator.notification.alert("Product exist!", null, "Information", "Ok");
                            } else {
                                $.getJSON("https://rebp.nl/json/products.json", function(product) {

                                      product.data.forEach(function(val) {

                                        if( val.name == result.text){

                                            if(val.vegan == true) {
                                                navigator.notification.alert("This product is vegan.", null, "Info", "Close");

                                                    db.transaction(function(tx) {
                                                        tx.executeSql(
                                                            "INSERT INTO scans (data) VALUES (?)",
                                                            [result.text],
                                                            function(tx, res) {
                                                                $("#scans ul").empty().show();
                                                                //navigator.notification.alert("insertId: " + res.insertId + ", rows affected: " + res.rowsAffected, null, "Item Scanned", 'Close');
                                                                //navigator.notification.alert("Product added!", null, "Information", "Ok");
                                                                savedScans();
                                                            },
                                                            function(tx, res) {
                                                                navigator.notification.alert(res.message, null, "Error", "Close");
                                                            });
                                                    });

                                            } else {
                                                navigator.notification.alert("This product is not vegan.", null, "Info", "Close");
                                            }
                                            
                                        }

                                      });
                                });
                            }
                        }
                            
                    }, function(tx, res){
                        $.getJSON("https://rebp.nl/json/products.json", function(data) {

                              data.data.forEach(function(val) {


                                if( val.name == result.text){

                                    if(val.vegan == true) {
                                        navigator.notification.alert("This product is vegan.", null, "Info", "Close");

                                            db.transaction(function(tx) {
                                                tx.executeSql("CREATE TABLE IF NOT EXISTS scans (id integer primary key, data text)");
                                                tx.executeSql(
                                                    "INSERT INTO scans (data) VALUES (?)",
                                                    [result.text],
                                                    function(tx, res) {
                                                        $("#scans ul").empty().show();
                                                        //navigator.notification.alert("insertId: " + res.insertId + ", rows affected: " + res.rowsAffected, null, "Item Scanned", 'Close');
                                                        //navigator.notification.alert("Product added!", null, "Information", "Ok");
                                                        savedScans();
                                                    },
                                                    function(tx, res) {
                                                        navigator.notification.alert(res.message, null, "Error", "Close");
                                                    });
                                            });

                                    } else {
                                        navigator.notification.alert("This product is not vegan.", null, "Info", "Close");
                                    }
                                    
                                }

                              });
                        });
                    });

            });

        },

        // error callback function
        function (error) {
            navigator.notification.alert("Error: "+ error, null, "Something went wrong!", 'Close');
        },

        // options object
        {
            "preferFrontCamera" : false,
            "showFlipCameraButton" : true,
            "showTorchButton" : true,
            "orientation" : "potrait"
        }
    );
}

function showMaps() {
  var div = document.getElementById("map_canvas");

  map = plugin.google.maps.Map.getMap(div);

  map.on(plugin.google.maps.event.MAP_READY, function(){

    var onSuccess = function(location) {

        map.moveCamera({
          target: {
            lat: location.latLng.lat,
            lng: location.latLng.lng
          },
          zoom: 12
        }, function(){

            map.addMarker({
                title: "You are here.",
                position: new plugin.google.maps.LatLng(location.latLng.lat, location.latLng.lng),
            });

            $.getJSON("https://rebp.nl/json/restaurants.json", function(data) {

                  data.data.forEach(function(val) {

                    var name = val.name;
                    var website = val.website;

                    map.addMarker({
                        title: val.name,
                        snippet: "Tap to visit website",
                        position: new plugin.google.maps.LatLng(val.latitude, val.longitude),
                        icon: 'https://rebp.nl/photos/vegan.png',
                        markerClick: function(marker, val) {
                          marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function() {
                            navigator.notification.confirm("Visit website?", function(buttonIndex){
                                if(buttonIndex == 1) {
                                    cordova.InAppBrowser.open(website, '_blank', 'location=yes');
                                }
                            }, name, ['Yes', 'No']);
                          });
                        }
                    });

                  });
            }) 
        });


    };

    var onError = function(msg) {
      alert("error: " + msg);
    };
    map.getMyLocation(onSuccess, onError);

  });   
}

function savedScans() {

    db.transaction(function(tx) {
      tx.executeSql(
        "SELECT * FROM scans;",
        [],
        function(tx, res) {

            $("#no-scans").hide();
            for (var i=0; i<res.rows.length; i++) {
                var row = res.rows.item(i);                
                $("#scans ul").append("<li><a class='menu-item center-text' href='#' style='padding: 0;'>"+row.data+"</a></li>");
            }
        },
        function(tx, res) {
            $("#scans ul").hide();
          $("#no-scans").append("<p class='center-text'>Scanned Products Empty</p>");
        });
    });

}

