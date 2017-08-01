// Google Search - Selenium Example Script
//See https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs for detailed instructions

var username = 'user@email.com'; //replace with your email address 
var authkey = '12345'; //replace with your authkey 

var webdriver = require('selenium-webdriver'),
    SeleniumServer = require('selenium-webdriver/remote').SeleniumServer,
    request = require('request');

var remoteHub = "http://" + username + ":" + authkey + "@hub.crossbrowsertesting.com:80/wd/hub";

//add multiple browsers to run in parallel here
var browsers = [
   { browserName: 'firefox', os_api_name: 'Win7', browser_api_name: 'FF27', screen_resolution: '1024x768' },
   { browserName: 'chrome', os_api_name: 'Mac10.9', browser_api_name: 'Chrome40x64', screen_resolution: '1024x768' },
   { browserName: 'internet explorer', os_api_name: 'Win8.1', browser_api_name: 'IE11', screen_resolution: '1024x768' }
];

var flows = browsers.map(function(browser) {
    return webdriver.promise.createFlow(function() {

        var caps = {
            name : 'Google Search - Selenium Test Example',
            build :  '1.0',
            
            browserName : browser.browserName, // <---- this needs to be the browser type in lower case: firefox, internet explorer, chrome, opera, or safari
            browser_api_name : browser.browser_api_name, 
            os_api_name : browser.os_api_name,     
            screen_resolution : browser.screen_resolution,

            record_video : "true",
            record_network : "true",
            record_snapshot :  "false",
         
            username : username,
            password : authkey
        };

        var driver = new webdriver.Builder()
             .usingServer(remoteHub)
             .withCapabilities(caps)
             .build();

        //need sessionId before any api calls
        driver.getSession().then(function(session){ 
            
            var sessionId = session.id_;

            driver.get('http://www.google.com');
            var element = driver.findElement(webdriver.By.name('q'));
            element.sendKeys('cross browser testing');
            element.submit();
            driver.call(takeSnapshot, null, sessionId);
            driver.getTitle().then(function(title) {
                if (title !== ('cross browser testing - Google Search')) {
                    throw Error('Unexpected title: ' + title);
                }
            });
            driver.quit();
            driver.call(setScore, null, 'pass', sessionId);
        });
    });
});

webdriver.promise.fullyResolved(flows).then(function() {
    console.log('All tests passed!');
});

webdriver.promise.controlFlow().on('uncaughtException', function(err){
    console.error('There was an unhandled exception! ' + err);
});




//Call API to set the score
function setScore(score, sessionId) {

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
function takeSnapshot(sessionId) {

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
