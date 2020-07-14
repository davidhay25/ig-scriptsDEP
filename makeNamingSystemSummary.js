#!/usr/bin/env node
/**
 * make the summary XML file for naming system
 * 
 * execute: ./makeTerminology {IG}
 * 
 * 
 * */

let fs = require('fs');
let igRoot = "/Users/davidhay/IG/";

//retrieve the IG
console.log(process.argv);

let igName = process.argv[2];   
if (!igName) {
    console.log("No IG specified. Must be in the command eg: ./makeNamingSystemSummary nhi")
    return;
}

let fullPath = igRoot + igName;



if ( ! fs.existsSync(fullPath)) {
    console.log("The IG '" + igName + "' does not exist (at least, there is no folder with that name.")
    return;
}

let rootPath = igRoot + igName +  "/input/vocabulary/";


let outFile = igRoot + igName + "/fsh/ig-data/input/pagecontent/NamingSystems.md";
let outFile1 = igRoot + igName + "/input/pagecontent/NamingSystems.md";  // for IG publisher

console.log('Building NamingSystem summary for ' + igName)
console.log("IG is located at "+ fullPath);
console.log('Location of terminology:' + rootPath)
console.log('Writing output to ' + outFile)
console.log(" and " + outFile1)

//return



/*
let rootPath = "input/vocabulary/";
//let outFile = "fsh/ig-data/input/pagecontent/terminology.xml";

let outFile = "fsh/ig-data/input/pagecontent/terminology.md";
let outFile1 = "input/pagecontent/terminology.md";  // for IG publisher
*/
//let arFile = []
let arNS = []



arNS.push("### Identifiers");

let nsText = `
<div>
These are identifiers that are used across the New Zealand sector. They are defined using <a href='http://hl7.org/fhir/namingsystem.html'>NamingSystem</a> resources.
</div>
`
arNS.push(nsText);

arNS.push("<table class='table table-bordered table-condensed'>");

arNS.push("<tr><th>Description</th><th>Url</th><th>Other identifiers</th><th>Responsible</th></tr>")


fs.readdirSync(rootPath).forEach(function(file) {

    let ar = file.split('-')
    switch (ar[0]) {
        case 'NamingSystem' :
            let ns = loadFile(file);
            //console.log(ns)
            let otherId =[];        //to record other ids than url
            let nsLne = "<tr>";
            nsLne += "<td>" + ns.description + "</td>";
            nsLne += "<td>" 
            if (ns.uniqueId) {
                ns.uniqueId.forEach(function(id){
                    if (id.type == "uri") {
                        nsLne += "<div>" + id.value + "</div>"
                    } else {
                        otherId.push(id)
                    }
                })
            }
            nsLne += "</td>" 

            //Other Ids (if any)
            nsLne += "<td>" 
            if (otherId.length > 0) {
                otherId.forEach(function(id){
                    nsLne += "<div>" + id.value + "</div>"
                })
            }
            nsLne += "</td>" 
           
            nsLne += "<td>" + ns.responsible + "</td>";


            nsLne += "</tr>"
            arNS.push(nsLne)
            break;
    }

})
arNS.push("</table>")
arNS.push("<br/><br/>")
//arVS.push("\r\n")




let fle = arNS.join('\r\n');
fs.writeFileSync(outFile,fle);      //in sushi
fs.writeFileSync(outFile1,fle)      //for ig pub



function loadFile(path) {
    let fullFileName = rootPath + path;
    let contents = fs.readFileSync(fullFileName, {encoding: 'utf8'});
    let resource = JSON.parse(contents)
    return resource;
}

