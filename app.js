
// change user 
var chosenUser = process.argv[2] || "nil";


const co = require('co');

// site specific
const ff = require('./config/config.js').fitnessFirst;
const selectors = require('./config/config.js').fitnessFirst.selectors;

const mailOptions = require('./config/config.js').mailOptions;
const mailgun = require('mailgun-js')(mailOptions);

const webd = require('selenium-webdriver');
const chromeCapabilities = webd.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', { args: ['--headless'] });

require('chromedriver');
// you need this line unless you are referring to global chrome version 

const d = new webd.Builder()
    .forBrowser('chrome')
    .withCapabilities(chromeCapabilities)
    .build(); 

// resize browser to prevent click errors
d.manage().window().setSize(1050, 900);

const sendScreenshot = (userArg) => {
    let user = userArg || 'Default User';
    let emailObject = mailOptions.emailObject;
    emailObject.subject = `Screenshot for booking by ${user}`;
    d.takeScreenshot()
        .then(base64String => {
            let imageBuffer = new Buffer(base64String, 'base64');
            let date = (new Date()).toString();
            let inline = new mailgun.Attachment({
                    data: imageBuffer,
                    filename: date,
                    contentType: 'image/png'
                }
            );
            emailObject.inline = inline;
        })
        .then(res => {
            console.log('Sending email');
            mailgun.messages().send(emailObject, function (error, body) {
                console.log(body);
            });
        });
}

const clickBookButton = (chosenClass, chosenUser) => {
    let bookbutton = d.wait(webd.until.elementLocated(chosenClass), 15000);
    //scrollIntoView default param true, will push the elem to the top of the page 
    d.executeScript("arguments[0].scrollIntoView()", bookbutton);
    // check if button is less than 300px from top, scroll up 350)
    let checkHeightScript = "if(arguments[0].getBoundingClientRect().top < 300){ window.scrollBy(0, -350)}";
    d.executeScript(checkHeightScript, bookbutton);
    bookbutton.click();
    d.wait(webd.until.elementLocated(selectors.submitButton), 15000).click();
    sendScreenshot(chosenUser);
}


// you need a webd.until
let user = ff.users[chosenUser];

// load page, send screenshot as timestamp
d.get(ff.url);
sendScreenshot(chosenUser);

// choose Bugis page, using CO function
co(function *(){
    var bugisScript;
    let options = d.findElement({ id: 'optLocation' });
    let array = yield options.findElements({ css: 'option' });
    for (let i = 0; i < array.length; i ++ ) {
      var place = array[i];
      let t = yield place.getAttribute('innerText');
      t = t.replace(/^\s+|\s+$/g, "");
      console.log(t);
      if (t === "Bugis Junction" ) {
          let bugisValue = yield place.getAttribute('value');
          console.log(`Value of ${t} is ${bugisValue}`);
          bugisScript = `document.getElementById('optLocation').value = '${bugisValue}' `;
          console.log(bugisScript);
          break;
      }
    }
    d.executeScript(bugisScript);
    d.executeScript("window.subForm()");
  });


// login and select class
d.findElement(selectors.userIdField).sendKeys(user.email);
d.findElement(selectors.userPassword).sendKeys(user.password);
d.findElement(selectors.loginButton).click();
d.sleep(23000);
d.navigate().refresh();
d.sleep(23000); 
d.navigate().refresh();
// must sleep otherwise it will jump to locate the element before logging in
clickBookButton(selectors.testingClass, chosenUser);
d.findElement(selectors.logoutButton).click();

d.quit();
