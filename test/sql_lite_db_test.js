/*
    [sql_lite_db_test.js]

    encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');

var sql_parts = require("../src/sql_lite_db.js");


describe( "sql_lite_db_test.js", function(){
    var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
    var closeConnection = sql_parts.closeConnection;
    var addActivityLog2Database = sql_parts.addActivityLog2Database;
    var getListOfActivityLogWhereDeviceKey = sql_parts.getListOfActivityLogWhereDeviceKey;

    /**
     * @type 各テストからはアクセス（ReadOnly）しない定数扱いの共通変数。
     */
    var ORIGINAL = {};
    var sqlConfig = { "database" : "だみ～.sqlite3" };
    var stubInstance, databaseArgs1;
    before( function(){
        var stubSqlite3 = { 
            "verbose" : sinon.stub() 
        };
        stubInstance = { "sqlite3" : "fake"}; // newで返すオブジェクトのモック。
        databaseArgs1 = "";

        // sqlite3モジュールに対するI/Oをモックに差し替える。
        stubSqlite3.verbose.onCall(0).returns({
            "Database" : function( databaseName, callback ){
                // newされた時のコンスタラクタ処理に相当。
                // returnすることで差替えることが出来る。
                setTimeout(function() {
                    callback(); // 非同期で呼ばれる、、、を疑似的に行う。
                }, 100);
                databaseArgs1 = databaseName;
                return stubInstance;
            }
        });
        ORIGINAL[ "sqlite3" ] = sql_parts.factoryImpl.sqlite3.getInstance();
        ORIGINAL[ "dbs" ] = sql_parts.factoryImpl.db.getInstance();
        sql_parts.factoryImpl.sqlite3.setStub( stubSqlite3 );
    });
    after( function(){
        sql_parts.factoryImpl.sqlite3.setStub( ORIGINAL.sqlite3 );
        sql_parts.factoryImpl.db.setStub( ORIGINAL.dbs );
    });

    describe( "::createPromiseForSqlConnection()",function(){
        it("正常系",function(){
            var dbs = sql_parts.factoryImpl.db.getInstance();
            
            expect( dbs[ sqlConfig.database ] ).to.not.exist;
            return shouldFulfilled(
                sql_parts.createPromiseForSqlConnection( sqlConfig )
            ).then(function(){
                expect( databaseArgs1 ).to.equal( sqlConfig.database );
                expect( dbs[ sqlConfig.database ] ).to.equal( stubInstance );
            });
        });
    });
    describe( "::getListOfActivityLogWhereDeviceKey()",function(){
        it("正常系。期間指定なし。",function(){
            var period = null; //無しの場合
            var deviceKey = "にゃーん。";
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var stub_instance = sinon.stub();
            var expected_rows = [
                { "created_at": '2017-10-22 23:59:00.000', "type": 900 }
            ];

            dbs[ sqlConfig.database ] = {
                "all" : stub_instance
            };
            stub_instance.callsArgWith(2, null, expected_rows);
            return shouldFulfilled(
                sql_parts.getListOfActivityLogWhereDeviceKey( sqlConfig.database, deviceKey, period )
            ).then(function(result){
                assert( stub_instance.calledOnce );
                var called_args = stub_instance.getCall(0).args;
                expect( called_args[0] ).to.equal(
                    "SELECT created_at, type FROM activitylogs " 
                    + "WHERE [owners_hash]=\'" + deviceKey + "\'"
                );
                expect( called_args[1].length ).to.equal( 0 );
                expect( result ).to.deep.equal( expected_rows );
            });
        });
    });
    describe( "::closeConnection()",function(){
        it("正常系。期間指定なし。",function(){
            var period = null; //無しの場合
            var deviceKey = "にゃーん。";
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var stub_instance = sinon.stub();

            dbs[ sqlConfig.database ] = {
                "close" : stub_instance
            };
            stub_instance.callsArgWith(0, null);
            return shouldFulfilled(
                sql_parts.closeConnection( sqlConfig.database )
            ).then(function(result){
                assert( stub_instance.calledOnce );
                expect( dbs[ sqlConfig.database ] ).to.not.be.exist;
            });
            
        });
    });
    //describe( "::addActivityLog2Database()",function(){
    //    it("正常系");
    //});
    //clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
    // clock.restore(); // 時間停止解除。
});



