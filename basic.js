// Basic - Selenium Example Script
// see https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs for details
// runs test against http://crossbrowsertesting.github.io/selenium_example_page.html

var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var request = require('request');
var remoteHub = 'http://hub.crossbrowsertesting.com:80/wd/hub';

var username = 'user@email.com'; //replace with your email address 
var authkey = '12345'; //replace with your authkey 
 
var caps = {
    name : 'Basic - Selenium Test Example',
    build :  '1.0',
    browser_api_name : 'IE10', 
    os_api_name : 'Win7x64-C2', 
    screen_resolution : '1024x768',
    record_video : "true",
    record_network : "true",
    browserName : "internet explorer", // <---- this needs to be the browser type in lower case: firefox, internet explorer, chrome, opera, or safari
    username : username,
    password : authkey
};

var sessionId = null;

//register general error handler
webdriver.promise.controlFlow().on('uncaughtException', webdriverErrorHandler);
 
var driver = new webdriver.Builder()
    .usingServer(remoteHub)
    .withCapabilities(caps)
    .build();

driver.getSession().then(function(session){
    sessionId = session.id_; //need for API calls
});
driver.get("http://crossbrowsertesting.github.io/selenium_example_page.html");
driver.getTitle().then(function(title){
    console.log('page title is ', title)
});

driver.quit();

//set the score as passing
driver.call(setScore, null, 'pass');

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