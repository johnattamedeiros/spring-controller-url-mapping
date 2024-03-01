var lineReader = require('line-reader'), Promise = require('bluebird');
const path = require('path');
const fs = require('fs');

const controllerMapping = "public class (?<controllerName>[A-Za-z]+Controller) {"
const restMapping = "(@)(?<method>[A-Za-z]+)(Mapping)"
const pathMapping = "(\\()(path|value|produces|[A-Za-z]+)?([ ]=[ ])?(\\\")?(?<path>.*)(\\\")"
const requestMappingPath = "@RequestMapping.*(\")(?<pathrequest>.*)(\")";
const controllerDirectory = "./controllers/";

const directoryPath = path.join(__dirname, controllerDirectory);
fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach(function (fileName) {
        let controllersData = { paths: [] };
        var eachLine = Promise.promisify(lineReader.eachLine);
        eachLine(controllerDirectory + "/" + fileName, function (line) {

            const regexController = new RegExp(controllerMapping);
            let matchController = line.match(regexController);
            if (matchController) {
                controllersData.name = matchController.groups.controllerName;
            }

            let matchRest = line.match(restMapping);
            if (matchRest) {
                let path = {};
                if (matchRest.groups.method == "Request") {
                    let requestMapping = line.match(requestMappingPath);
                    controllersData.mainPath = requestMapping.groups.pathrequest;

                } else {
                    path.method = matchRest.groups.method;
                    let matchPath = line.match(pathMapping);
                    if (matchPath) {
                        path.url = matchPath.groups.path;
                    }
                    controllersData.paths.push(path);
                }
            }

        }).then(function () {
            console.log(controllersData);
            let controllerPaths = controllersData.paths;
            controllerPaths.forEach(path => {
                let pathUrl = path.url == undefined ? "" : path.url;
                let mainPath = controllersData.mainPath == undefined ? "" : controllersData.mainPath;
                let content = path.method + " - " + mainPath + pathUrl + "," + controllersData.name + "\r\n";
                fs.appendFileSync('./endpoints.csv', content);
            });
        }).catch(function (err) {
            console.error("Error on paths analyze" + err);
        });
    });
});






