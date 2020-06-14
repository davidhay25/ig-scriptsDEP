#!/usr/bin/env node

/**
 * Create an html summary of all the extensions, ValueSets and CodeSystems in all IG's
 * 
 */

const junk = require('junk');

let fs = require('fs');
//note that the folder is the same as the IG id... - important for creating links...
let arFolder = ["nzbase","nhi","hpi","northernRegion"]
let onlineServer = "http://build.fhir.org/ig/HL7NZ/";   //where the IGs are. Allows links from the summary...
let onlineBranch = "/branches/master/";     //currently the dev master branch. Used for the link.

let uploadToIGServer = true;    //will upload to root@igs.clinfhir.com:/var/www/html/summary.html

//load all the profiles and look up the extensions in use - and the ValueSets (note this comes from the differential)
let hashExtensions = {}         //extensions indexed by url
let hashValueSetPaths = {}      //valuesets used by path
arFolder.forEach(function(folder){
    let fullFolderPath = "../" + folder + "/input/profiles";
    if (fs.existsSync(fullFolderPath)) {



        let arFiles = fs.readdirSync(fullFolderPath).filter(junk.not);
        arFiles.forEach(function(name){
            let fullFileName = fullFolderPath + "/"+ name;
            let contents = fs.readFileSync(fullFileName).toString();
            let profile = JSON.parse(contents)
            profile.differential.element.forEach(function(ed){
                if (ed.type) {
                    ed.type.forEach(function(typ){
                        if (typ.code == 'Extension' && typ.profile) {
                            typ.profile.forEach(function(prof){
                                hashExtensions[prof] = hashExtensions[prof] || []
                                let item = {};
                                item.profileName = profile.id
                                item.path = ed.path
                                item.sliceName = ed.sliceName;
                                item.IG = folder
                                hashExtensions[prof].push(item)
                            })
                        }
                    })
                }

                //now the binding
                if (ed.binding && ed.binding.valueSet) {
                    let vsUrl = ed.binding.valueSet
                    hashValueSetPaths[vsUrl] = hashValueSetPaths[vsUrl] || []

                    let obj = {display:ed.path, IG:folder}
                    obj.linkName = "StructureDefinition-"+profile.id + ".html"
                    hashValueSetPaths[vsUrl].push(obj)

                    hashValueSetPaths[vsUrl].push({display:ed.path})

                }


            })

        })

    }
})
//console.log(hashExtensions)
//return;

//load the extension definitions
let arExtensions = []
arFolder.forEach(function(folder){
    let fullFolderPath = "../" + folder + "/input/extensions";
    if (fs.existsSync(fullFolderPath)) {
        let arFiles = fs.readdirSync(fullFolderPath).filter(junk.not);
        //console.log(arFiles)
        arFiles.forEach(function(name){
            let fullFileName = fullFolderPath + "/"+ name;
            //if ()
            let contents = fs.readFileSync(fullFileName).toString();
            let ext = JSON.parse(contents)
            let sum = {name:ext.name,description:ext.description,IG:folder}
            sum.context = ext.context || [{expression:""}];
            sum.id = ext.id;
            sum.canonicalUrl = ext.url;
           // sum.IG = 
            let ar = ext.url.split('/')
            sum.url = ar[ar.length-1]
            arExtensions.push(sum)

            //now look for extensions that use this vs
            ext.differential.element.forEach(function(ed){
                if (ed.binding && ed.binding.valueSet) {
                    let vsUrl = ed.binding.valueSet
                    hashValueSetPaths[vsUrl] = hashValueSetPaths[vsUrl] || []
                    let obj = {display:'Ext: ' + ext.id, IG:folder}
                    obj.linkName = "StructureDefinition-"+ext.id + ".html"
                    hashValueSetPaths[vsUrl].push(obj)

                }
            })


        })
    }
})
/* - sort by IG
arExtensions.sort(function(a,b){
    let c1 = a.context[0].expression
    let c2 = b.context[0].expression
    if (c1 > c2) {
        return 1
    } else {
        return -1
    }
})
*/
//load the ValueSets & CodeSystems
let arVS = [], arCS = []

arFolder.forEach(function(folder){
    let fullFolderPath = "../" + folder + "/input/vocabulary";
    if (fs.existsSync(fullFolderPath)) {
        let arFiles = fs.readdirSync(fullFolderPath).filter(junk.not);
        //console.log(arFiles)
        arFiles.forEach(function(name){
            if (name.substr(0,1) !== '.') {
                let fullFileName = fullFolderPath + "/"+ name;
                //console.log(fullFileName)
                let contents = fs.readFileSync(fullFileName).toString();
                
                let json = JSON.parse(contents)
              
                let ar = name.split('-')
                switch (ar[0]) {
                    case 'ValueSet' :
                        let vs = {url:json.url,description:json.description,IG:folder}
                        vs.linkName = name.replace('.json','.html')
                        vs.name = json.name
                        vs.codeSystem = []
                        if (json.compose && json.compose.include) {
                            json.compose.include.forEach(function(inc){
                                let linkName = json.name.replace('.json','.html')
                                linkName = "CodeSystem-"+linkName
                                vs.codeSystem.push({system:inc.system,IG:folder,linkName:linkName})
                            })
                        }
                        
                        arVS.push(vs)
                        break;
                    case 'CodeSystem' :
                        let cs = {url:json.url,description:json.description,IG:folder}
                        cs.linkName = name.replace('.json','.html')
                        cs.name = json.name
                        
                        arCS.push(cs)
    
                        break;
                }
            }
        })
    }
    
})

/* sort by IG
arVS.sort(function(a,b){
    if (a.url > b.url) {
        return 1
    } else {
        return -1
    }
})
*/

//=============== render HTML ============

let ar = []
ar.push("<html>")
ar.push("<head>")
ar.push("<link rel='stylesheet' type='text/css' href='https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css'/>")
ar.push("</head>")

ar.push("<body  style='padding: 8px' >")
ar.push("<h1  class='alert alert-secondary' >Extensions, ValueSets and CodeSystems defined for New Zealand Implementation Guides</h1>")


ar.push("<h2>Extensions</h2>")
ar.push("<table width='100%' border='1' cellspacing='0' cellpadding='5px'>")
ar.push("<tr><th>IG</th><th>Id</th><th>Context</th><th>Url</th><th>Description</th><th>Used by</th></tr>")
arExtensions.forEach(function(ext){
    ar.push("<tr>")
    ar.push("<td>" + ext.IG + "</td>")
    let link = onlineServer + ext.IG + onlineBranch + "StructureDefinition-" + ext.id + ".html";
    ar.push("<td><a href='" + link + "'>"  + ext.url + "</a></td>")

    ar.push("<td>");
    if (ext.context) {
        ext.context.forEach(function(con){
            ar.push("<div>" + con.expression + "</div>")
        })
    }
    ar.push("</td>");
    ar.push("<td>" + ext.canonicalUrl + "</td>")
    ar.push("<td>" + ext.description + "</td>")

    ar.push("<td>");
    if (hashExtensions[ext.canonicalUrl]) {
        hashExtensions[ext.canonicalUrl].forEach(function(item){
            let profileName = item.profileName
            let link = onlineServer + item.IG + onlineBranch + "StructureDefinition-" + profileName + ".html";
            ar.push("<div><a href='" + link + "'>"  + profileName + "</a></div>")
           // ar.push("<div title='"+item.path+ " " + item.sliceName+     "'   ><a href='" + link + "'>"  + profileName + "</a></div>")
            //ar.push("<div>" + link + "</div>");
        })
    }
    ar.push("</td>");

    ar.push("</tr>")
})

ar.push("</table>")
ar.push("<br/>");

//render the vs
ar.push("<h2>ValueSets</h2>")
ar.push("<table width='100%' border='1' cellspacing='0' cellpadding='5px'>")
ar.push("<tr><th>IG</th><th>Name</th><th>Url (CodeSystems)</th><th>Description</th><th>Where used</th></tr>")
arVS.forEach(function(vs){
    ar.push("<tr>")
    ar.push("<td>" + vs.IG + "</td>")
    ar.push("<td>" + vs.name + "</td>")

    let link = onlineServer + vs.IG + onlineBranch + vs.linkName;

    ar.push("<td>");
    ar.push("<a href='" + link + "'>"  + vs.url + "</a>")
    vs.codeSystem.forEach(function(system){


        let csLink = onlineServer + system.IG + onlineBranch + system.linkName;
        ar.push("<div><a href='"+csLink+"' >(" +system.system+ ")</a></div>");
    })
    ar.push("</td>");
/*
    ar.push("<td>");
    vs.codeSystem.forEach(function(system){
        ar.push("<div>" + system + "</div>");
    })



    ar.push("</td>");
    */
    ar.push("<td>" + vs.description + "</td>")

    ar.push("<td>");
    let paths = hashValueSetPaths[vs.url]
    if (paths) {
        paths.forEach(function(obj){
            //let link = obj.linkName
            let link = onlineServer + obj.IG + onlineBranch + obj.linkName;




            ar.push("<div><a href='" + link + "'>" + obj.display + "</a></div>");
        })
    }
   
    ar.push("</td>");

    //hashValueSetPaths


    ar.push("</tr>")
})
ar.push("</table>")
ar.push("<br/>");

//render the cs
ar.push("<h2>CodeSystems</h2>")
ar.push("<table width='100%' border='1' cellspacing='0' cellpadding='5px'>")
ar.push("<tr><th>IG</th><th>Name</th><th>Url</th><th>Description</th></tr>")
arCS.forEach(function(cs){
    ar.push("<tr>")
    ar.push("<td>" + cs.IG + "</td>")
    ar.push("<td>" + cs.name + "</td>")

    let link = onlineServer + cs.IG + onlineBranch + cs.linkName;
    ar.push("<td><a href='" + link + "'>"  + cs.url + "</a></td>")



   // ar.push("<td>" + vs.url + "</td>")
    ar.push("<td>" + cs.description + "</td>")


    ar.push("</tr>")
})
ar.push("</table>")
ar.push("<br/>");


ar.push("<br/>");
ar.push("<em>Summary generated: " + new Date().toString());// toISOString() )

ar.push("</body>")
ar.push("</html>")
//console.log(arExtensions)

let summary = ar.join('\r\n')
fs.writeFileSync('summary.html',summary)

if (uploadToIGServer) {
    console.log('Uploading to server...')
    const { exec } = require('child_process');
    
    exec("scp ./summary.html root@igs.clinfhir.com:/var/www/html/summary.html",(err,stdout,stderr) =>{
        if (err) {
            console.log('Upload failed')
        }
    })
}


//scp ./summary.html root@igs.clinfhir.com:/var/www/html/summary.html