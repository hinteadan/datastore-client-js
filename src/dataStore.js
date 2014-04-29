(function ($, JSON, undefined) {
    'use strict';

    var chainOperation = {
            And: { id: 0, value: 'And' },
            Or: { id: 1, value: 'Or' }
        },
        operator = {
            EqualTo: { id: 0, value: 'Equals' },
            LowerThan: { id: 1, value: 'LowerThan' },
            LowerThanOrEqualTo: { id: 2, value: 'LowerThanOrEqual' },
            HigherThan: { id: 3, value: 'HigherThan' },
            HigherThanOrEqualTo: { id: 4, value: 'HigherThanOrEqual' },
            Containing: { id: 5, value: 'Contains' },
            BeginningWith: { id: 6, value: 'BeginsWith' },
            EndingWith: { id: 7, value: 'EndsWith' }
        },
        defaultMessageFor = {
            success: 'Operation completed successfully',
            failure: 'Cannot complete the operation, please try again or contact us'
        };

    function map(array, mapper) {
        /// <param name='mapper' type='Function' />
        /// <retunrs type='Array' />
        var mapping = [];
        for (var i = 0; i < array.length; i++) {
            mapping.push(mapper.call(undefined, array[i], i));
        }
        return mapping;
    }

    function Query(chainWith) {

        var self = this,
            chain = chainWith || chainOperation.And,
            parameters = [];

        function Parameter(name, operator, value){
            this.name = name;
            this.operator = operator;
            this.value = value;
            this.toString = function () {
                return name + '=' + operator.value + ':' + value;
            };
        }

        function addParameter(name) {
            return function (operator) {
                return function (value) {
                    parameters.push(new Parameter(name, operator, value));
                    return self;
                };
            };
        }

        function convertToQueryString() {
            return 'chainWith=' + chain.value + '&' +
                map(parameters, function (p) {
                    /// <param name='p' type='Parameter' />
                    return p.toString();
                }).join('&');
        }

        this.where = addParameter;
        this.toString = convertToQueryString;
    }

    function Entity(data, meta) {
        this.Id = null;
        this.Meta = meta || {};
        this.Data = data || null;
    }

    function OperationResult(isSuccess, reason, data) {
        this.isSuccess = isSuccess === true ? true : false;
        this.reason = reason || null;
        this.data = data;
        this.toString = function () {
            return this.reason ? this.reason :
                this.isSuccess ? defaultMessageFor.success :
                defaultMessageFor.failure;
        };
    }

    function HttpDataStore(name, url) {

        var storeUrl = url || 'http://localhost/HttpDataStore/';
        var storeName = name || 'Default/';
        if (storeName[storeName.length - 1] !== '/') {
            storeName += '/';
        }

        function doHttpRequest(url, type, data, onSuccess, onError) {
            $.ajax(url || storeUrl, {
                accepts: {
                    json: 'application/json'
                },
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify(data),
                error: onError,
                success: onSuccess,
                type: type || 'GET'
            });
        }

        function doCallback(callback, argsArray) {
            if (typeof (callback) !== 'function') {
                return;
            }
            callback.apply(null, argsArray);
        }

        function loadEntity(id, callback) {
            doHttpRequest(storeUrl + storeName + id, 'GET', undefined,
                function (entityData) {
                    var entity = new Entity(entityData.Data, entityData.Meta);
                    entity.Id = entityData.Id;
                    doCallback(callback, [new OperationResult(true, null, entity)]);
                },
                function (jqXHR, textStatus, errorThrown) {
                    doCallback(callback, [new OperationResult(false, errorThrown)]);
                });
        }

        function saveEntity(entity, callback) {
            /// <param name='entity' type='Entity' />
            doHttpRequest(storeUrl + storeName, 'PUT', entity,
                function (id) {
                    entity.Id = id;
                    doCallback(callback, [new OperationResult(true, null, entity)]);
                },
                function (jqXHR, textStatus, errorThrown) {
                    doCallback(callback, [new OperationResult(false, errorThrown)]);
                });
        }

        function queryMetaData(query, callback) {
            doHttpRequest(storeUrl + 'meta/' + storeName + '?' + query, 'GET', undefined,
                function (queryResult) {
                    doCallback(callback, [new OperationResult(true, null, queryResult)]);
                },
                function (jqXHR, textStatus, errorThrown) {
                    doCallback(callback, [new OperationResult(false, errorThrown)]);
                });
        }

        function queryData(query, callback) {
            doHttpRequest(storeUrl + storeName + '?' + query, 'GET', undefined,
                function (queryResult) {
                    doCallback(callback, [new OperationResult(true, null, queryResult)]);
                },
                function (jqXHR, textStatus, errorThrown) {
                    doCallback(callback, [new OperationResult(false, errorThrown)]);
                });
        }

        function deleteEntity(id, callback) {
            doHttpRequest(storeUrl + storeName + id, 'DELETE', undefined,
                function () {
                    doCallback(callback, [new OperationResult(true, null, undefined)]);
                },
                function (jqXHR, textStatus, errorThrown) {
                    doCallback(callback, [new OperationResult(false, errorThrown)]);
                });
        }

        this.Save = saveEntity;
        this.Load = loadEntity;
        this.QueryMeta = queryMetaData;
        this.Query = queryData;
        this.Delete = deleteEntity;
    }

    this.H = this.H || {};
    this.H.DataStore = {
        Store: HttpDataStore,
        Entity: Entity,
        chainBy: chainOperation,
        is: operator,
        OperationResult: OperationResult,
        Query: Query
    };
    if (!this.ds) {
        this.ds = this.H.DataStore;
    }

}).call(this, this.jQuery, this.JSON);