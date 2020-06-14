#!/usr/bin/env node
/**
 * make the summary MD file for terminology
 * 
 * execute: ./makeProfilesAndExtensions {IG}
 * 
 * 
 * */

let fs = require('fs');
let igRoot = "/Users/davidhay/IG/";

//retrieve the IG
//console.log(process.argv);

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

let rootPath = igRoot + igName +  "/input/profiles/";
//let outFile = "fsh/ig-data/input/pagecontent/terminology.xml";

let profileOutFile = igRoot + igName + "/fsh/ig-data/input/pagecontent/profiles.xml";
let profileOutFile1 = igRoot + igName + "/input/pagecontent/profiles.xml";  // for IG publisher

let extOutFile = igRoot + igName + "/fsh/ig-data/input/pagecontent/extensions.xml";
let extOutFile1 = igRoot + igName + "/input/pagecontent/extensions.xml";  // for IG publisher

console.log('Building summary of profiles & extensions for ' + igName)
console.log("IG is located at "+ fullPath);
console.log('Location of StructureDefinitions:' + rootPath)
console.log('Writing profile output to ' + profileOutFile)
console.log(" and " + profileOutFile1)
console.log('Writing extension output to ' + extOutFile)
console.log(" and " + extOutFile1)


//all the IGs
let arAllIgs = ["nzbase","nhi","hpi","northernRegion"]      //all the known IGs


// =========================   defined Profiles   ================

let onlineServer = "http://build.fhir.org/ig/HL7NZ/";   //where the IGs are
let onlineBranch = "/branches/master/";     //currently the dev master branch


let ar = []
ar.push("<div xmlns='http://www.w3.org/1999/xhtml'>")
//ar.push("<h3>Profiles</h3>")
ar.push("<br/><strong>Profiles defined in this guide</strong><br/><br/>")
//ar.push('<a name="profiles"> </a>')   
//ar.push("<h3>Profiles defined in this guide</h3>")

//ar.push("<table width='100%' border='1' cellspacing='0' cellpadding='5px'>")
ar.push("<table class='table table-bordered table-hover table-sm'>")

ar.push("<tr><th>Id</th><th>Url</th><th>Description</th></tr>")

let fullFolderPath = "../" + igName + "/input/profiles";
if (fs.existsSync(fullFolderPath)) {
    let arFiles = fs.readdirSync(fullFolderPath);
    arFiles.forEach(function(name){
        if (name.indexOf(".json") > -1 ) {
            let fullFileName = fullFolderPath + "/"+ name;
            let contents = fs.readFileSync(fullFileName).toString();
            let profile;
            try {
                profile = JSON.parse(contents)
            } catch (ex) {
                console.log("error reading " + fullFileName)
            }
            
            ar.push("<tr>")

            let link = onlineServer + igName + onlineBranch + "StructureDefinition-" + profile.id + ".html";

            ar.push("<td><a href='"+link+"'>" + profile.id + "</a></td>")
            ar.push("<td>" + profile.url + "</td>")
            ar.push("<td>" + cleanText(profile.description) + "</td>")
            ar.push("</tr>")
        }
    })

    ar.push("</table>")
}

ar.push("</div>")


let file = ar.join('\r\n')
fs.writeFileSync(profileOutFile,file);
fs.writeFileSync(profileOutFile1,file);

// ========= defined extensions
let hashExtensions = {} //extensions defined in the guide

ar.length = 0;

ar.push("<div xmlns='http://www.w3.org/1999/xhtml'>")


//ar.push('<a name="definedExtensions"> </a>')   
//ar.push("<h3>Extensions defined in this guide</h3>")

ar.push("<br/><strong>Extensions defined in this guide</strong><br/><br/>")
ar.push("<table width='100%' border='1' cellspacing='0' cellpadding='5px'>")
ar.push("<tr><th>Id</th><th>Url</th><th>Context of Use</th><th>Description</th></tr>")

fullFolderPath = "../" + igName + "/input/extensions";
if (fs.existsSync(fullFolderPath)) {
    arFiles = fs.readdirSync(fullFolderPath);
    arFiles.forEach(function(name){
        if (name.indexOf(".json") > -1 ) {
            let fullFileName = fullFolderPath + "/"+ name;
            let contents = fs.readFileSync(fullFileName).toString();
            
            let ext;
            try {
                ext = JSON.parse(contents)
            } catch (ex) {
                console.log("error reading " + fullFileName)
            }

            //let ext = JSON.parse(contents)
            hashExtensions[ext.url] = true;     //make a note of the extension
            ar.push("<tr>")

            let link = onlineServer + igName + onlineBranch + "StructureDefinition-" + ext.id + ".html";

            ar.push("<td><a href='"+link+"'>" + ext.id + "</a></td>")
            ar.push("<td>" + ext.url + "</td>")
            ar.push("<td>")
            if (ext.context) {
                ext.context.forEach(function(ctx){
                    ar.push("<div>" + ctx.expression + "</div>")
                })
                
            }

            ar.push("</td>")

            ar.push("<td>" + cleanText(ext.description) + "</td>")
            ar.push("</tr>")
        }
    })

    ar.push("</table>")
}

//  ========== external extensions referred to by this guide =========
//let arFolder = ["nzbase","nhi","hpi","northernRegion"]      //all the known IGs


// first, load all the extensions in all the IGs. This will allow us to know where the IG was defined...
//let hashEveryIG = {}
///arFolder.forEach(function(folder){
    //let fullFolderPath = "../" + folder + "/input/profiles";




let hashAllExt = {};        //all extensions in all IGs
arAllIgs.forEach(function(folder){
    let fullFolderPath = "../" + folder + "/input/extensions";
    if (fs.existsSync(fullFolderPath)) {
        let arFiles = fs.readdirSync(fullFolderPath);
        arFiles.forEach(function(name){
            if (name.indexOf(".json") > -1 ) {
                let fullFileName = fullFolderPath + "/"+ name;
                let contents = fs.readFileSync(fullFileName).toString();
                let profile = JSON.parse(contents)
                hashAllExt[profile.url] = {extension:profile,ig:folder};
            }
        })
    }
})


//console.log(hashAllExt)


//no - not all !!!!!!!!!
///arFolder.forEach(function(folder){
    //let fullFolderPath = "../" + folder + "/input/profiles";



    console.log('extensions used but defined externaly')


ar.push('<a name="externalExtensions"> </a>')   
ar.push("<h3>Extensions used but defined elsewhere</h3>")
ar.push("<table width='100%' border='1' cellspacing='0' cellpadding='5px'>")
ar.push("<tr><th>Url</th><th>Description</th><th>IG</th></tr>")

fullFolderPath = "../" + igName + "/input/profiles";

if (fs.existsSync(fullFolderPath)) {
    let arFiles = fs.readdirSync(fullFolderPath);
    arFiles.forEach(function(name){
        if (name.indexOf(".json") > -1 ) {
            let fullFileName = fullFolderPath + "/"+ name;
            let contents = fs.readFileSync(fullFileName).toString();
            let profile = JSON.parse(contents)

            profile.differential.element.forEach(function(ed){
                if (ed.type) {
                    ed.type.forEach(function(typ){
                        if (typ.code == 'Extension' && typ.profile) {
                            typ.profile.forEach(function(prof){
                                //console.log(prof)
                                if (! hashExtensions[prof]) {

                                    let extDef = hashAllExt[prof];
                                    if (extDef) {
                                        //console.log("---> external (but in IGs)", extDef.extension.description)

                                        ar.push("<tr>")

                                        let link = onlineServer + extDef.ig + onlineBranch + "StructureDefinition-" + extDef.extension.id + ".html";

                                        ar.push("<td><a href='"+link+"'>" + extDef.extension.url + "</a></td>")

                                        //ar.push("<td>" + extDef.extension.url + "</td>")
                                        ar.push("<td>" + cleanText(extDef.extension.description) + "</td>")
                                        ar.push("<td>" + extDef.ig + "</td>")
                                        ar.push("</tr>")
                                    } else {
                                        console.log("---> external")

                                        ar.push("<tr>")
                                        ar.push("<td>" + prof + "</td>")
                                        ar.push("<td>Defined outside of known IG's</td>")
                                        ar.push("</tr>")
                                    }
                                    

                                }  else {
                                    //console.log('Defined in IG')
                                }                                       
                            })
                        }
                    })
                }
            })
    }

    })
}
//})
ar.push("</table>")



ar.push("</div>")


let file1 = ar.join('\r\n')
fs.writeFileSync(extOutFile,file1);
fs.writeFileSync(extOutFile1,file1);


//ensure that characters that can update XML are 'escpaed'
function cleanText(s) {
    //replace all instances of '& ' with 'and '
    let s1 = s.split('& ').join('and ')
    return s1


}