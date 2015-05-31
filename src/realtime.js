(function ($, delay) {
    'use strict';

    if (!$ || !$.connection) {
        throw new Error('Jquery with signalR is required to run the H DataStore Real-time API');
    }

    function RealtimeApi(hubServer) {

        var handler = {
            onChange: null,
            onCreate: null,
            onDelete: null
        };

        function setHandler(type, withThis) {
            handler[type] = withThis;
        }

        this.handle = function (type, entity) {
            if (typeof (handler[type]) !== 'function') {
                return;
            }
            handler[type].call(null, entity);
        };

        this.announceEntityChange = function (entity) {
            hubServer.announceEntityChange(entity);
        };

        this.announceEntityCreated = function (entity) {
            hubServer.announceEntityCreated(entity);
        };

        this.announceEntityRemoved = function (entity) {
            hubServer.announceEntityRemoved(entity);
        };

        this.setOnChangeHandler = function (doThis) {
            setHandler('onChange', doThis);
            return this;
        };
        this.setOnCreateHandler = function (doThis) {
            setHandler('onCreate', doThis);
            return this;
        };
        this.setOnDeleteHandler = function (doThis) {
            setHandler('onDelete', doThis);
            return this;
        };
    }

    function RealtimeService(url, realtimePath) {
        var self = this,
            storeUrl = url || 'http://localhost/HttpDataStore/',
            rootPath = realtimePath || 'realtime',
            realtime = null,
            retryCount = 0,
            retryMax = 20,
            retryIn = 500,
            realtimeApi = null,
            whenInitialized = null;

        function areHubsLoaded() {
            return Boolean($.connection.entityHub);
        }

        function initialize() {
            realtimeApi = null;
            realtime = $.connection.entityHub;

            realtime.client.entityChanged = function (e) { realtimeApi.handle('onChange', e); };
            realtime.client.entityCreated = function (e) { realtimeApi.handle('onCreate', e); };
            realtime.client.entityRemoved = function (e) { realtimeApi.handle('onDelete', e); };

            $.connection.hub.url = storeUrl + rootPath;
            $.connection.hub.start().done(function () {
                realtimeApi = new RealtimeApi(realtime.server);
                if (typeof (whenInitialized) === 'function') {
                    whenInitialized.call(self, realtimeApi);
                }
            });
        }

        function tryInitialize() {
            if (areHubsLoaded()) {
                retryIn = 500;
                initialize();
                return;
            }
            else if (retryCount === retryMax) {
                if (typeof (whenInitialized) === 'function') {
                    whenInitialized.call(self, new Error('Real-Time API Unavailable'));
                }
                return;
            }
            retryCount++;
            retryIn *= Math.floor(retryCount / 3) || 1;
            delay(tryInitialize, retryIn);
        }
        tryInitialize();

        this.isAvailable = function () {
            return Boolean(realtimeApi);
        };

        this.bind = function () {
            return {
                then: function (doThis) {
                    if (typeof (doThis) !== 'function') {
                        return;
                    }

                    if (self.isAvailable()) {
                        doThis.call(self, realtimeApi);
                        return;
                    }

                    whenInitialized = doThis;
                }
            };
        };
    }

    this.H = this.H || {};
    this.H.DataStore = this.H.DataStore || {};
    this.H.DataStore.Realtime = {
        Service: RealtimeService
    };

}).call(this, this.$, this.setTimeout);