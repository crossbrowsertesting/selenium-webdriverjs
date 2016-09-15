// Drag and Drop - Selenium Example Script
// see https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs for details
// runs test against http://crossbrowsertesting.github.io/drag-and-drop.html

var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';
var assert = require('selenium-webdriver/testing/assert');

var username = 'user@email.com'; //replace with your email address 
var authkey = '12345'; //replace with your authkey  

var caps = {
    name : 'Drag-and-Drop Example',
    build :  '1.0',
    browser_api_name : 'IE10', 
    os_api_name : 'Win7x64-C2', 
    screen_resolution : '1024x768',
    record_video : 'true',
    record_network : 'true',
    browserName : 'internet explorer', // <---- this needs to be the browser type in lower case: firefox, internet explorer, chrome, opera, or safari
    username : username,
    password : authkey
};

var sessionId = null;

//register general error handler
webdriver.promise.controlFlow().on('uncaughtException', webdriverErrorHandler);

console.log('Connection to the CrossBrowserTesting remote server');

var driver = new webdriver.Builder()
            .usingServer(remoteHub)
            .withCapabilities(capabilities)
            .build();

//console.log('driver is ', driver)



// All driver calls are automatically queued by flow control.
// Async functions outside of driver can use call() function.
console.log('Waiting on the browser to be launched and the session to start');

driver.getSession().then(function(session){
    sessionId = session.id_; //need for API calls
    console.log('Session ID: ', sessionId); 
    console.log('See your test run at: https://app.crossbrowsertesting.com/selenium/' + sessionId)
});

//load your URL
driver.get('http://crossbrowsertesting.github.io/drag-and-drop.html');

//take snapshot via cbt api
driver.call(takeSnapshot);

//get draggable and droppable elements
var draggable = driver.findElement(webdriver.By.id("draggable"));
var droppable = driver.findElement(webdriver.By.id("droppable"));

//move draggable to droppable and release via actions
// driver.actions()
//     .mouseMove(draggable)
//     .mouseDown()
//     .mouseMove(droppable)
//     .mouseUp()
//     .perform();

//shortcut method for drag and drop
driver.actions().dragAndDrop(draggable,droppable).perform();

//take snapshot via cbt api
driver.call(takeSnapshot);

droppable.findElement(webdriver.By.css("p")).getText().then(function(text){
    assert(text).equalTo('Dropped!');
})

//quit the driver
driver.quit()

//set the score as passing
driver.call(setScore, null, 'pass').then(function(result){
    console.log('set score to pass')
});


//Call API to set the score
function setScore(score) {

    //webdriver has built-in promise to use
    var deferred = webdriver.promise.defer();
    var result = { error: false, message: null }

    if (sessionId){
        
        request({
            method: 'PUT',
            uri: 'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId,
            body: {'action': 'set_score', 'score': score },
            json: true
        },
        function(error, response, body) {
            if (error) {
                result.error = true;
                result.message = error;
            }
            else if (response.statusCode !== 200){
                result.error = true;
                result.message = body;
            }
            else{
                result.error = false;
                result.message = 'success';
            }

            deferred.fulfill(result);
        })
        .auth(username, authkey);
    }
    else{
        result.error = true;
        result.message = 'Session Id was not defined';
        deferred.fulfill(result);
    }

    return deferred.promise;
}

//Call API to get a snapshot 
function takeSnapshot() {

    //webdriver has built-in promise to use
    var deferred = webdriver.promise.defer();
    var result = { error: false, message: null }
    
    if (sessionId){

       
        request.post(
            'https://crossbrowsertesting.com/api/v3/selenium/' + sessionId + '/snapshots', 
            function(error, response, body) {
                if (error) {
                    result.error = true;
                    result.message = error;
                }
                else if (response.statusCode !== 200){
                    result.error = true;
                    result.message = body;
                }
                else{
                    result.error = false;
                    result.message = 'success';
                }
                //console.log('fulfilling promise in takeSnapshot')
                deferred.fulfill(result);
            }
        )
        .auth(username,authkey);
        
    }
    else{
        result.error = true;
        result.message = 'Session Id was not defined';
        deferred.fulfill(result); //never call reject as we don't need this to actually stop the test
    }

    return deferred.promise;
}

//general error catching function
function webdriverErrorHandler(err){

    console.error('There was an unhandled exception! ' + err);

    //if we had a session, end it and mark failed
    if (driver && sessionId){
        driver.quit();
        setScore('fail').then(function(result){
            console.log('set score to fail')
        })
    }
}
