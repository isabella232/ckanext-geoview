// mvt preview module
ckan.module('mvtpreview', function (jQuery, _) {
  return {
    options: {
      table: '<div class="table-container"><table class="table table-striped table-bordered table-condensed"><tbody>{body}</tbody></table></div>',
      row:'<tr><th>{key}</th><td>{value}</td></tr>'
    },
    initialize: function () {
      var self = this;

      self.el.empty();
      self.el.append($("<div></div>").attr("id","map"));
      self.map = ckan.commonLeafletMap('map', this.options.map_config);

      // hack to make leaflet use a particular location to look for images
      L.Icon.Default.imagePath = this.options.site_url + 'js/vendor/leaflet/dist/images';

      // assumes that we are using NextGIS Web!
      var res_url = preload_resource['url'];
      var res_id = res_url.match(/resource\/(.*)\/geojson/)[1];
      var mvt_url = res_url.replace('geojson', '{z}/{x}/{y}.mvt');

      //Globals that we can change later.
      var fillColor = 'rgba(149,139,255,0.4)';
      var strokeColor = 'rgb(20,20,20)';

      var mvtLayer = new L.TileLayer.MVTSource({
        // The URL Endpoint that we fetch MVT. Required.
        url: mvt_url,

        // Flagging debug as true provides a grid that shows the edge 
        // of the tiles and the z,x,y coordinate address of the tiles.
        debug: false,

        // A list of vector tile layers that will capture mouse click
        // events and be selectable on the map.
        // In NextGIS Web we are using resource ID as MVT layer name.
        clickableLayers: [res_id],

        // This callback is fired every time a layer in clickableLayers
        // is clicked on.
        onClick: function(e) {
          var feature = e.feature;
          var body = '';
          if (feature) {
            jQuery.each(feature.properties, function(key, value) {
              body += L.Util.template(self.options.row, {key: key, value: value});
            });
            var popupContent = L.Util.template(self.options.table, {body: body});
            var popup = L.popup()
              .setLatLng(e.latlng)
              .setContent(popupContent)
              .openOn(feature.map);
          }
        },

        // Each MVT Feature needs a unique ID. You can specify a
        // specific function to create a unique ID that will be
        // associated with a given feature. Required.
        getIDForLayerFeature: function(feature) {
          return feature.properties.id;
        },

        // If this is set to true, only one feature can be selected at a time.
        // If it is false, multiple features can be selected simultaneously.
        mutexToggle: true,

        // Returning false skips over the feature and it is not drawn. Required.
        filter: function(feature, context) {
          if (feature.layer.name === res_id) {
            return true;
          }
          return false;
        },

        // This function sets properties that the HTML5 Canvas' context
        // uses to draw on the map.
        style: function (feature) {
          var style = {};

          var type = feature.type;
          switch (type) {
            case 1: //'Point'
              style.color = 'rgba(51,136,255,1)';
              style.radius = 5;
              style.selected = {
                color: 'rgba(255,255,0,0.5)',
                radius: 6
              };
              break;
            case 2: //'LineString'
              style.color = 'rgba(51,136,255,1)';
              style.size = 3;
              style.selected = {
                color: 'rgba(255,25,0,0.5)',
                size: 4
              };
              break;
            case 3: //'Polygon'
              style.color = fillColor;
              style.outline = {
                color: strokeColor,
                size: 1
              };
              style.selected = {
                color: 'rgba(255,140,0,0.3)',
                outline: {
                  color: 'rgba(255,140,0,1)',
                  size: 2
                }
              };
              break;
          }
          return style;
        }

      }).addTo(self.map);

      // TODO: Move start extent to settings.
      map.setView(new L.LatLng(45, 135), 7);
    }
  };
});

