#!/usr/bin/env node
/**
 * make the CapabilityStatement XML file for terminology
 * 
 * execute: ./makeProfilesAndExtensions {IG}
 * 
 * 
 * */

let fs = require('fs');
let igRoot = "/Users/davidhay/IG/";

//retrieve the IG


let igName = process.argv[2];   
if (!igName) {
    console.log("No IG specified. Must be in the command eg: ./makeTerminology nhi")
    return;
}

let fullPath = igRoot + igName;

if ( ! fs.existsSync(fullPath)) {
    console.log("The IG '" + igName + "' does not exist (at least, there is no folder with that name.")
    return;
}

let rootPath = igRoot + igName +  "/input/capabilities/";

let outFile = igRoot + igName + "/fsh/ig-data/input/pagecontent/CapabilityStatement.xml";
let outFile1 = igRoot + igName + "/input/pagecontent/CapabilityStatement.xml";  // for IG publisher

console.log('Building summary of the CapabilityStatement resource ' + igName)
console.log("IG is located at "+ fullPath);
console.log('Location of CapabilityStatement:' + rootPath)
console.log('Writing output to ' + outFile)
console.log(" and " + outFile1)

let ar = []
ar.push("<div xmlns='http://www.w3.org/1999/xhtml'>")
ar.push("<br/><div>API summary (generated from the capabilityStatement resource)</div><br/><br/>")



//let fullFolderPath = "../" + rootPath;
console.log(rootPath)
if (fs.existsSync(rootPath)) {
    let arFiles = fs.readdirSync(rootPath);
    arFiles.forEach(function(name){

        if (name.substr(0,3) == 'Cap') {
            //for now - assume only 1. will need what to do if there is > 1

            let fullFileName = rootPath + "/"+ name;
            let contents = fs.readFileSync(fullFileName).toString();
            let capStmt = JSON.parse(contents)

            //todo - convert markdown into HTML...
            if (capStmt.description) {
                ar.push('<br/><div>' + capStmt.description + "</div><br/>") 
            }

            capStmt.rest.forEach(function(rest){
                rest.resource.forEach(function(res){
                    ar.push(`<a name="${res.type}"> </a>`)   
                    ar.push(`<h3>${res.type}</h3>`)   

                    if (res.interaction) {
                        ar.push("<strong>Interactions</strong>")
                        ar.push("<table class='table table-bordered table-condensed'>")
                        ar.push("<tr><th width='60%'>Code</th><th width='40%'>Documentation</th></tr>")
                        res.interaction.forEach(function(int){
                            ar.push("<tr>")
                            ar.push(`<td>${int.code}</td>`)
                            let documentation = cleanText(int.documentation) || ""
                            ar.push(`<td>${documentation}</td>`)
                            ar.push("</tr>")
    
                        })
                        ar.push("</table>")
                    }
                    
                    if (res.searchParam) {
                        ar.push("<strong>Search Parameters</strong>")
                        ar.push("<table class='table table-bordered table-condensed'>")
                        ar.push("<tr><th width='15%'>Name</th><th>Type</th> <th>Definition</th><th width='40%'>Documentation</th></tr>")
                        res.searchParam.forEach(function(int){
                            ar.push("<tr>")
                            ar.push(`<td>${int.name}</td>`)
                            ar.push(`<td>${int.type}</td>`)
                            let definition =  ""
                            if (int.definition) {
                                definition = int.definition
                            } 
                            ar.push(`<td>${definition}</td>`)
                            let documentation = cleanText(int.documentation) || ""
                            ar.push(`<td>${documentation}</td>`)
                            ar.push("</tr>")
    
                        })
                        ar.push("</table>")
                    }


                    if (res.searchInclude) {
                        ar.push("<strong>Search includes</strong>")
                        ar.push("<table class='table table-bordered table-condensed'>")
                        ar.push("<tr><th width='15%'>Name</th></tr>")
                        res.searchInclude.forEach(function(inc){
                            ar.push("<tr>")
                            ar.push(`<td>${inc}</td>`)
                            ar.push("</tr>")
    
                        })
                        ar.push("</table>")
                        ar.push("<em>These are the _include parameters that are supported on Patient searches</em>")
                        ar.push("<br/><br/>")
                    }


                })


            })


           


            



        }


console.log(name)

    })

}


ar.push("</div>")
let file1 = ar.join('\r\n')
fs.writeFileSync(outFile,file1);
fs.writeFileSync(outFile1,file1);



//ensure that characters that can update XML are 'escpaed'
function cleanText(s) {
    if (s) {
        //replace all instances of '& ' with 'and '
        let s1 = s.split('& ').join('and ')
        return s1
    }
    


}