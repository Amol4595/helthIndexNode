var mysql = require('mysql');
const fs = require('fs');
var jwt = require('jsonwebtoken');
var CryptoJS = require("crypto-js");
const serverPath = 'http://52.172.206.240/';
const key = CryptoJS.enc.Utf8.parse('M@h1ndra$1234567');
const iv = CryptoJS.enc.Utf8.parse('0001000100010001');
const privateKey = 'privateKey';
const jwtOpt = {};//{ expiresIn: 60 * 10 };// 
const adminPassword = 'admin';
var requestify = require('requestify'); 
const csvjson = require('csvjson');
const readFile = require('fs').readFile;
const writeFile = require('fs').writeFile;

//mmkndmobdev,//pass,123
var con = mysql.createPool({
    host: "localhost",
    port:"3306",
    user: "root",
    password: "Mahindra@123",
    database: "doctorapp"
});

// var con = mysql.createPool({
//     host     : 'localhost',
//     user     : 'root',
//     password : '',
//     database : 'mydb'
// });

setInterval(function () {
    con.query('SELECT 1');
    //console.log('def query');
}, 1000*60*5);
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var mimetype = file.mimetype.split("/");
        if(mimetype[0]=='image'){
            cb(null, './uploads/images');
        }else if(mimetype[0]=='video'){
            cb(null, './uploads/videos');
        }else if(mimetype[1]=='pdf'){
            cb(null, './uploads/others');
        }
    },
    filename: function (req, file, cb) {
        var arr = file.originalname.split("."); // Split the string using dot as separator
        var lastVal = arr.pop();// Get last element
        var firstVal = arr.join("."); 
        cb(null,  firstVal + '-' + Date.now() + '.'+lastVal);
    }
});
var upload = multer({ storage: storage }).array("uploads[]",2);

exports.test = (req,res)=>{
    response(res,200,'',{'status':'success'});
}
//---------------------------User Data-----------------------------------------------------------//
exports.login = (req,res) =>{
    decryptData(req.body.param).then((data)=>{
        let employee_id = data.employee_id;
        let password = data.password;
        if(employee_id!='admin'){
            let sqlQuery = "Select *,EHD.employee_id AS employee_id from employee_general_health_details as EHD LEFT join employee_general_detail as ED ON  ED.employee_id = EHD.employee_id where EHD.employee_id = "+employee_id+" LIMIT 1";
            //console.log('sqlquery',sqlQuery)
            con.query(sqlQuery, function (err, result, fields) {
                if (err){
                    response(res,400,err,{'status':'failed'});
                }else{
                    jwt.sign({employee_id:employee_id}, privateKey, jwtOpt, function(err, token) {
                        storeToken(employee_id,token).then((storeToken)=>{
                            if(result.length>0){
                                result[0]['access_token'] = token;
                                result[0]['employee_health_data_found'] = true;
                                response(res,200,'',{'data':result,'status':'success','msg':'user health data exist.'});
                            }else{
                                let sqlQuery = "select * from employee_general_detail where employee_id = "+employee_id;
                                let resultTemp = [];
                                con.query(sqlQuery, function (err, result2, fields) {
                                    if (err){
                                        response(res,400,err,{'status':'failed'});
                                    }else{
                                        if(result2.length>0){
                                            resultTemp = [{'tips_subscribed':result2[0].tips_subscribed,
                                            'policy_no':result2[0].policy_no,
                                            'policy_link':result2[0].policy_link,
                                            'blood_group':result2[0].blood_group,
                                            'allergy':result2[0].allergy,
                                            'disease':result2[0].disease,
                                            'donate':result2[0].donate,
                                            'contacts':result2[0].contacts,
                                            'employee_name':result2[0].employee_name,
                                            'blood_bank_location':result2[0].blood_bank_location,
                                            'empEmail':result2[0].empEmail,
                                            'nameofposition':result2[0].nameofposition,
                                            'access_token':token,
                                            'employee_health_data_found':false,
                                            'employee_id':employee_id}];
                                        }else{
                                            resultTemp = [{'access_token':token,'employee_health_data_found':false,'employee_id':employee_id}];
                                        }
                                    }
                                    response(res,200,'',{'data':resultTemp,'status':'success','msg':'user health data not exist..'});
                                });
                            }
                        });
                    });
                } 
            });
        }else{
            if(password==adminPassword){
                jwt.sign({employee_id:employee_id}, privateKey, jwtOpt, function(err, token) {
                    storeToken(employee_id,token).then((storeToken)=>{
                        let result = [];
                        result[0] = {};
                        result[0].access_token = token;
                        response(res,200,'',{'data':result,'status':'success','msg':'user health data exist.'});
                    });
                });
            }else{
                response(res,200,'',{'data':[],'status':'success','msg':'Invalid Credentials.'});
            }
        }
    });
}

exports.logout = (req,res) =>{
    let parameters = res.paramDecrpted;
    let sqlQuery = 'UPDATE employee_general_detail set token="" WHERE employee_id = ?' ;
    console.log('logout',sqlQuery,parameters.employee_id);
    con.query(sqlQuery,[parameters.employee_id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success'});
        } 
    });
}
exports.getAllDetails = (req,res)=>{
    let parameters = res.paramDecrpted;
    if(parameters.employee_id){
        let fields = "* ";
        let select = "SELECT ";
        let from = " from employee_general_health_details WHERE 1=1";
        let where = "";
        let limit = "";
        let offset = "";
        let sort = " ORDER BY year ASC ";
        Object.keys(parameters).forEach(function(key) {
            if(key == 'fields'){
                fields = parameters[key];
            }else if(key == 'limit'){
                limit = " LIMIT  "+parameters[key];;
            }else if(key == 'offset'){
                offset = " OFFSET  "+parameters[key];;
            }else{
                where = where + " AND "+key+"='"+parameters[key]+"' ";
            }
        });
        let sqlQuery = select+fields+from+where+sort+limit+offset;
        con.query(sqlQuery, function (err, result, fields) {
            if (err){
                response(res,400,err,{'status':'failed'});
            }else{
                response(res,200,'',{'data':result,'status':'success'});
            } 
        });
    }else{
        response(res,400,err,{'status':'insufficient data'});
    }
}

exports.addUpdatePersonalInfo = (req,res)=>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id?parameters.employee_id:'';
    let blood_group = parameters.blood_group?parameters.blood_group:'';
    let policy_no = parameters.policy_no?parameters.policy_no:'';
    let policy_link = parameters.policy_link?parameters.policy_link:'';
    let allergy = parameters.allergy?parameters.allergy:'';
    let disease = parameters.disease?parameters.disease:'';
    let donate = parameters.donate?parameters.donate:0;donate = donate?1:0;
    let contacts = parameters.contacts?parameters.contacts:'';
    let blood_bank_location = parameters.blood_bank_location?parameters.blood_bank_location:'';
    let empEmail = parameters.empEmail?parameters.empEmail:'';
    let nameofposition = parameters.nameofposition?parameters.nameofposition:'';
    let employee_name = parameters.employee_name?parameters.employee_name:'';

    let param = [blood_group,policy_no,policy_link,allergy,disease,donate,contacts,blood_bank_location,empEmail,nameofposition,employee_name,employee_id];
    let sqlQuery = 'SELECT * from employee_general_detail where employee_id = ?' ;
    con.query(sqlQuery,[employee_id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            if(result.length==0){
                sqlQuery = 'INSERT INTO employee_general_detail (blood_group,policy_no,policy_link,allergy,disease,donate,contacts,blood_bank_location,empEmail,nameofposition,employee_name,employee_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)' ;
            }else{
                sqlQuery = 'UPDATE employee_general_detail set blood_group=?, policy_no=?, policy_link=?, allergy=?, disease=?, donate=?, contacts=?, blood_bank_location=?, empEmail=?, nameofposition=?,employee_name=? WHERE employee_id = ?' ; 
            }
            con.query(sqlQuery,param, function (err, result, fields) {
                if (err){
                    response(res,400,err,{'status':'failed'});
                }else{
                    response(res,200,'',{'status':'success'});
                } 
            });
        } 
    });
}

exports.getHealthParamInfo = (req,res) =>{
    let sqlQuery = 'SELECT * from health_params_info' ;
    con.query(sqlQuery,[], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        }
    });
}

exports.updateHealthParamInfo = (req,res) =>{
    let parameters = res.paramDecrpted;
    let id = parameters.id;
    let title = capitalize(parameters.title);
    let description = parameters.description?parameters.description:'';
    let summary = parameters.summary?parameters.summary:'';
    let sqlQuery = "UPDATE health_params_info set title=?, description =?, summary=? WHERE id = ?";
    con.query(sqlQuery,[title,description,summary,id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success'});
        } 
    });
}

exports.getPolicyProviderInfo = (req,res) =>{
    let sqlQuery = 'SELECT * from insurance_provider' ;
    con.query(sqlQuery,[], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        }
    }); 
}

exports.updatePolicyProviderInfo = (req,res) =>{
    let parameters = res.paramDecrpted;
    let id = parameters.id;
    let steps = parameters.description?parameters.description:'';
    let sqlQuery = "UPDATE insurance_provider set steps=? WHERE id = ?";
    con.query(sqlQuery,[steps,id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success'});
        } 
    });
}
//---------------------------tips related--------------------------------------------------------//
exports.getAllTips = (req,res)=>{
    let parameters = res.paramDecrpted;
    let fields = "* ";
    let select = "SELECT ";
    let from = " from health_tips WHERE 1=1";
    let where = "";
    let limit = "";
    let offset = "";
    let sort = " ORDER BY created_at DESC ";
    Object.keys(parameters).forEach(function(key) {
        //console.log('here');
        if(key == 'fields'){
            fields = parameters[key];
        }else if(key == 'limit'){
            limit = " LIMIT  "+parameters[key];;
        }else if(key == 'offset'){
            offset = " OFFSET  "+parameters[key];;
        }else{
            if(parameters[key]&&parameters[key]!=''){
                where = where + " AND "+key+" LIKE '%"+parameters[key]+"%' ";
            }
        }
    });
    let sqlQuery = select+fields+from+where+sort+limit+offset;
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            result.forEach(element => {
                element["type"]="desc";
                if(element["image"]){
                    if(element["video"]){
                        if(element["video"].includes("/videos")){
                            element["type"]="image+video";
                        }else{
                            element["type"]="image+pdf";
                        }
                    }else{
                        element["type"]="image";
                    }
                }else if(element["video"]){
                    if(element["video"].includes("/videos")){
                        element["type"]="video";
                    }else{
                        element["type"]="pdf";
                    }
                }
            });
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.getTipsWithAllSpecification = (req,res)=>{
    let parameters = res.paramDecrpted;
    let fields = "* ";
    let select = "SELECT ";
    let from = " from health_tips WHERE 1=1";
    let where = "";
    let limit = "";
    let offset = "";
    let sort = " ORDER BY created_at DESC ";
    let subcribed_specificationsVal = [];
    let employee_id = parameters.employee_id;
    getAllSubcrbdSpecification(employee_id).then(function (data){
        subcribed_specificationsVal = data;
        let subcribed_specificationsName = '';
        let subcribed_specificationsIds = [];
        subcribed_specificationsVal.forEach(element=>{
            subcribed_specificationsName = subcribed_specificationsName +",'"+ element.name+"'";
            subcribed_specificationsIds.push(element.id.toString());
        });
        subcribed_specificationsName = subcribed_specificationsName.slice(1);
        Object.keys(parameters).forEach(function(key) {
            if(key == 'fields'){
                fields = parameters[key];
            }else if(key == 'limit'){
                limit = " LIMIT  "+parameters[key];
            }else if(key == 'offset'){
                offset = " OFFSET  "+parameters[key];
            }else if(key == 'employee_id'){
                if(subcribed_specificationsName!='')
                where = where + " AND specificationKey IN ("+subcribed_specificationsName+")";
            }else{
                if(parameters[key]&&parameters[key]!=''){
                    where = where + " AND "+key+" LIKE '%"+parameters[key]+"%' ";
                }
            }
        });
        let sqlQuery = select+fields+from+where+sort+limit+offset;
        
        con.query(sqlQuery, function (err, result, fields) {
            if (err){
                response(res,400,err,{'status':'failed'});
            }else{
                result.forEach(element => {
                    element["type"]="desc";
                    if(element["image"]){
                        if(element["video"]){
                            if(element["video"].includes("/videos")){
                                element["type"]="image+video";
                            }else{
                                element["type"]="image+pdf";
                            }
                        }else{
                            element["type"]="image";
                        }
                    }else if(element["video"]){
                        if(element["video"].includes("/videos")){
                            element["type"]="video";
                        }else{
                            element["type"]="pdf";
                        }
                    }
                });
                let getAllSpecificationVal = [];
                getAllSpecification().then(function(data){
                    getAllSpecificationVal = data;
                    response(res,200,'',{'data':result,
                                    'status':'success',
                                    'specifications':getAllSpecificationVal,
                                    'subcribed_specifications':subcribed_specificationsVal,
                                    'subcribed_specifications_ids':subcribed_specificationsIds});
                });
            } 
        });
    });
}

exports.addTips = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            response(res,400,err,{'status':'failed'});
        } else if (err) {
            // An unknown error occurred when uploading.
            response(res,400,err,{'status':'failed'});
        }else{
            let parameters = req.body;
            let title = SanitizeHtml(capitalize(parameters.title));
            let description = parameters.description?SanitizeHtml(parameters.description):'';
            let specification = parameters.specification?SanitizeHtml(parameters.specification):'';
            let specificationKey = parameters.specificationKey?SanitizeHtml(parameters.specificationKey):'';
            let image;
            let video;
            if(req.files[0]){
                let mimetype = req.files[0].mimetype.split("/");
                mimetype = mimetype[0];
                if(mimetype=='image'){
                    image = req.files[0].path?serverPath+req.files[0].path.replace(/\\/g, "/"):'';
                }else{
                    video = req.files[0].path?serverPath+req.files[0].path.replace(/\\/g, "/"):'';
                }
            }

            if(req.files[1]){
                let mimetype = req.files[1].mimetype.split("/");
                mimetype = mimetype[0];
                if(mimetype=='image'){
                    image = req.files[1].path?serverPath+req.files[1].path.replace(/\\/g, "/"):'';
                }else{
                    video = req.files[1].path?serverPath+req.files[1].path.replace(/\\/g, "/"):'';
                }
            }
            
            let sqlQuery = "INSERT INTO health_tips (title,description,image,video,specification,specificationKey) VALUES (?,?,?,?,?,?)";
			console.log(sqlQuery);
            con.query(sqlQuery, [title,description,image,video,specification,specificationKey], function(err, rows, fields) {  
                addUpdateSpecification(specificationKey);     
                if (err){
                    response(res,400,err,{'status':'failed'});
                }else{
                    response(res,200,'',{'status':'success'});
                } 
            });
        }
    });
};

exports.deleteTipsDetail = (req,res)=>{
    let parameters = res.paramDecrpted;
    let sqlQuery = 'DELETE from health_tips where id='+parameters.id;
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            deleteSpec(parameters.specificationKey);
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.updateTipsDetail = (req,res) =>{
    //deleteFile(req)
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            response(res,400,err,{'status':'failed'});
        } else if (err) {
            // An unknown error occurred when uploading.
            response(res,400,err,{'status':'failed'});
        }else{
            let parameters = req.body;
            let title = SanitizeHtml(capitalize(parameters.title));
            let description = parameters.description?SanitizeHtml(parameters.description):'';
            let specification = parameters.specification?SanitizeHtml(parameters.specification):'';
            let specificationKey = parameters.specificationKey?SanitizeHtml(parameters.specificationKey):'';
            let id = parameters.id;
            let image = parameters.prevImage;
            let video = parameters.prevVideo;
            let oldSpecification = parameters.oldSpecification;

            if(req.files[0]){
                let mimetype = req.files[0].mimetype.split("/");
                mimetype = mimetype[0];
                if(mimetype=='image'){
                    image = req.files[0].path?serverPath+req.files[0].path.replace(/\\/g, "/"):image;
                }else{
                    video = req.files[0].path?serverPath+req.files[0].path.replace(/\\/g, "/"):video;
                }
            }

            if(req.files[1]){
                let mimetype = req.files[1].mimetype.split("/");
                mimetype = mimetype[0];
                if(mimetype=='image'){
                    image = req.files[1].path?serverPath+req.files[1].path.replace(/\\/g, "/"):image;
                }else{
                    video = req.files[1].path?serverPath+req.files[1].path.replace(/\\/g, "/"):video;
                }
            }
            let sqlQuery = "UPDATE health_tips set title=?, description =?, image=?, video=? ,specification=?,specificationKey=? WHERE id = ?";
        
            con.query(sqlQuery, [title,description,image,video,specification,specificationKey,id], function(err, rows, fields) {
                addUpdateSpecification(specificationKey,oldSpecification);        
                if (err){
                    response(res,400,err,{'status':'failed'});
                }else{
                    response(res,200,'',{'status':'success'});
                } 
            });
        }
    });
}

exports.updateTipsSubcribe = (req,res)=>{
    let parameters = res.paramDecrpted;
    let sqlQuery = 'SELECT * from employee_general_detail where employee_id = ?' ;
    con.query(sqlQuery,[parameters.employee_id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            if(result.length==0){
                sqlQuery = 'INSERT INTO employee_general_detail (tips_subscribed,employee_id) VALUES (?,?)' ;
            }else{
                sqlQuery = 'UPDATE employee_general_detail set tips_subscribed=? WHERE employee_id = ?' ;
            }
            con.query(sqlQuery,[JSON.stringify(parameters.tips_subscribe),parameters.employee_id], function (err, result, fields) {
                if (err){
                    response(res,400,err,{'status':'failed'});
                }else{
                    response(res,200,'',{'status':'success'});
                } 
            });
        } 
    });
}

exports.publishTip = (req,res) =>{
    let parameters = res.paramDecrpted;
    let id = parameters.id;
    let status = parameters.status;
    let sqlQuery = "UPDATE health_tips set published=? WHERE id = ?";
    con.query(sqlQuery, [status,id], function(err, rows, fields) {     
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success'});
        } 
    });
}

exports.getAllSpecificationApi = (req,res) =>{
    getAllSpecification().then(function(result){
        response(res,200,'',{'status':'success','data':result});
    });
}
//--------------------------contact related-------------------------------------------------//
exports.getAllContact = (req,res)=>{
    let parameters = res.paramDecrpted;
    let fields = "cl.*,GROUP_CONCAT(mp.provider_id SEPARATOR ', ') as insurance_provider";
    let select = "SELECT ";
    let from = " from contact_list as cl ";
    let join = ' LEFT JOIN contact_insurance_provider_mapping mp on cl.id = mp.contact_id ';
    let where = "WHERE 1=1 ";
    let limit = "";
    let offset = "";
    let groupBy = " GROUP BY cl.id ";
    let sort = " ORDER BY cl.created_at ";//ASC
    Object.keys(parameters).forEach(function(key) {
        if(key == 'fields'){
            //fields = parameters[key];
        }else if(key == 'limit'){
            limit = " LIMIT  "+parameters[key];;
        }else if(key == 'offset'){
            offset = " OFFSET  "+parameters[key];;
        }else if(key == 'insurance_provider'&&parameters[key]!=''){
            where = where + " AND mp.provider_id = "+parameters[key];
        }else{
            if(parameters[key]&&parameters[key]!=''){
                if(key=='city'){
                    let city = parameters[key].join("','");
                    where = where + " AND "+key+" In('"+city+"') ";
                }else{
                    where = where + " AND "+key+" LIKE '%"+parameters[key]+"%' ";
                }
            }
        }
    });
    let sqlQuery = select+fields+from+join+where+groupBy+sort+limit+offset;
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        }
    });
}

exports.getContactsOfeachCategory = (req,res)=>{
    sqlQury = "(select *,null AS insurance_provider from contact_list where hType = 'Inside' ORDER BY created_at LIMIT 10) UNION (select *,null AS insurance_provider from contact_list where hType = 'Outside'  ORDER BY created_at  LIMIT 10) UNION (select cl.*,GROUP_CONCAT(mp.provider_id SEPARATOR ', ') as insurance_provider from contact_list cl LEFT JOIN contact_insurance_provider_mapping mp on cl.id = mp.contact_id where cl.hType = 'Insuranced'  ORDER BY cl.created_at limit 10)";
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            let insideCont= [];let outCont=[];let insurnceCont = [];
            let finalRes = [];
            result.forEach(element => {
                if(element.hType=='Inside'){
                    insideCont.push(element);
                }else if(element.hType=='Outside'){
                    outCont.push(element);
                }else if(element.hType=='Insuranced'){
                    insurnceCont.push(element);
                }
            });
            finalRes = {'Inside':insideCont,'Outside':outCont,'Insuranced':insurnceCont};
            response(res,200,'',{'status':'success','data':finalRes});
        } 
    });
}

exports.createContactDetail = (req,res) =>{
    let parameters = res.paramDecrpted;
    let name = parameters.name?capitalize(parameters.name):'';
    let num = parameters.num?parameters.num:'';
    let num2 = parameters.num2?parameters.num2:'';
    let loc = parameters.loc?parameters.loc:'';
    let state = parameters.state?parameters.state:'';
    let city = parameters.city?parameters.city:'';
    let specification = parameters.specification?ucfirst(parameters.specification):'';
    let hType = parameters.hType?parameters.hType:'';
    let insurance_provider = parameters.insurance_provider?parameters.insurance_provider:[];
    let sqlQuery = "INSERT INTO contact_list (name,primary_contact_no,location,secondary_contact_no,state,city,specification,hType) VALUES (?,?,?,?,?,?,?,?)";
    
    con.query(sqlQuery, [name,num,loc,num2,state,city,specification,hType], function(err, result, fields) {       
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            if(hType=='Insuranced'){
                AddNewInsuranceProvider(insurance_provider).then(function(insurance_provider_ids){
                    addInsrncePrvderContactMapping(result.insertId,insurance_provider_ids).then(function(data){
                        response(res,200,'',{'status':'success'});
                    },function(err){
                        response(res,400,err,{'status':'failed'});
                    });
                },function(err){
                    response(res,400,err,{'status':'failed'});
                });
            }else{
                response(res,200,'',{'status':'success'});
            }
        } 
    });
}

exports.updateContactDetail = (req,res)=>{
    let parameters = res.paramDecrpted;
    let name = parameters.name?capitalize(parameters.name):'';
    let num = parameters.num?parameters.num:'';
    let num2 = parameters.num2?parameters.num2:'';
    let loc = parameters.loc?parameters.loc:'';
    let state = parameters.state?parameters.state:'';
    let city = parameters.city?parameters.city:'';
    let specification = parameters.specification?ucfirst(parameters.specification):'';
    let hType = parameters.hType?parameters.hType:'';
    let id = parameters.id?parameters.id:'';
    let insurance_provider = parameters.insurance_provider?parameters.insurance_provider:[];
    let sqlQuery = 'UPDATE contact_list set name=? , primary_contact_no=?, secondary_contact_no=?, location=? ,state=?, city=?, specification=?, htype=? WHERE id=?' ;

    con.query(sqlQuery,[name,num,num2,loc,state,city,specification,hType,id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            deleteInsrncePrvderContactMapping(id).then(function(insurance_provider_ids){
                if(hType=='Insuranced'){
                    AddNewInsuranceProvider(insurance_provider).then(function(insurance_provider_ids){
                        addInsrncePrvderContactMapping(id,insurance_provider_ids).then(function(data){
                            response(res,200,'',{'status':'success'});
                        },function(err){
                            response(res,400,err,{'status':'failed'});
                        });
                    },function(err){
                        response(res,400,err,{'status':'failed'});
                    });
                }else{
                    response(res,200,'',{'status':'success','data':result});
                }
            });
        } 
    });
}

exports.deleteContactDetail = (req,res)=>{
    let parameters = res.paramDecrpted;
    let sqlQuery = 'DELETE from contact_list where id='+parameters.id;
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.publishContact = (req,res) =>{
    let parameters = res.paramDecrpted;
    let id = parameters.id;
    let status = parameters.status;
    let sqlQuery = "UPDATE contact_list set published=? WHERE id = ?";
    con.query(sqlQuery, [status,id], function(err, rows, fields) {     
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success'});
        } 
    });
}

exports.getAllInsrnceProvider = (req,res) =>{
    getAllInsrnceProvider().then(function(data){
        response(res,200,'',{'status':'success','data':data});
    });
}

exports.addNewInsuranceProvider = (req,res) =>{
    let parameters = res.paramDecrpted;
    let sqlQuery = 'Insert INTO insurance_provider (provider_name) VALUES (?)';
    con.query(sqlQuery,[parameters.provider_name], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result.insertId});
        } 
    });
}

exports.getMahindraLocation = (req,res) =>{
    let sqlQuery = "SELECT DISTINCT mahindra_location FROM `contact_list` WHERE mahindra_location != ''";
    con.query(sqlQuery,[], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}
//--------------------annual report-----------------------------------------------------------//
exports.annualReport = (req,res)=>{
    let parameters = res.paramDecrpted;
    let sqlQuery ='';
    if(parameters.id&&parameters.id>0){
        sqlQuery = 'Select * from annual_report where id ='+parameters.id;
    }else{
        sqlQuery = 'Select title,type,id,report_date from annual_report where employee_id ='+parameters.employee_id+" ORDER BY created_at DESC";
    }
    con.query(sqlQuery,[parameters.provider_name], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.addReport  = (req,res)=>{
    let parameters = res.paramDecrpted;
    let sqlQuery = "INSERT INTO annual_report (employee_id,title,file,pdf_link,type,report_date) VALUES (?,?,?,?,?,?)"; 
    con.query(sqlQuery,[parameters.employee_id,parameters.title,parameters.file,parameters.pdf_link,parameters.type,parameters.report_date], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.deleteReport  = (req,res)=>{
    let parameters = res.paramDecrpted;
    let sqlQuery = 'Delete from annual_report  WHERE id = ?' ;
    con.query(sqlQuery,[parameters.id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.annualReport_econn = (req,res)=>{
    let parameters = req.body;
    let sqlQuery ='';
    if(parameters.id&&parameters.id>0){
        sqlQuery = 'Select * from annual_report where id ='+parameters.id;
    }else{
        sqlQuery = 'Select title,type,id,report_date from annual_report where employee_id ='+parameters.employee_id+" ORDER BY created_at DESC";
    }
	console.log('annualReport_econn',sqlQuery);
    con.query(sqlQuery,[parameters.provider_name], function (err, result, fields) {
        if (err){
            res.status(400).json({'res':{'status':'failed'}});
            //response(res,400,err,{'status':'failed'});
        }else{
            res.status(200).json({'res':{'status':'success','data':result}});
            //response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.addReport_econn  = (req,res)=>{
    let parameters = req.body;
    let sqlQuery = "INSERT INTO annual_report (employee_id,title,file,pdf_link,type,report_date) VALUES (?,?,?,?,?,?)"; 
    con.query(sqlQuery,[parameters.employee_id,parameters.title,parameters.file,parameters.pdf_link,parameters.type,parameters.report_date], function (err, result, fields) {
        if (err){
			console.log('addReport_econn',err);
            res.status(400).json({'res':{'status':'failed'}});
        }else{
            res.status(200).json({'res':{'status':'success','data':result}});
        } 
    });
}

exports.deleteReport_econn  = (req,res)=>{
    let parameters = req.body;
    let sqlQuery = 'Delete from annual_report  WHERE id = ?' ;
    con.query(sqlQuery,[parameters.id], function (err, result, fields) {
        if (err){
            res.status(400).json({'res':{'status':'failed'}});
        }else{
            res.status(200).json({'res':{'status':'success','data':result}});
        } 
    });
}
//--------------------common function---------------------------------------------------------//
function response(res,resStatus,err,resData){
    encryptData(resData).then((encryptedData)=>{
        res.status(resStatus).json({'res':encryptedData});
    });
    if(resStatus==400){
        throw err;
    }
}

function addUpdateSpecification(spec,oldSpec){
    if(oldSpec){
        deleteSpec(oldSpec);
    }
    let sqlQuery = 'SELECT * from tips_specification where name = ?' ;
    con.query(sqlQuery,[spec], function (err, result, fields) {
        if (err){
            throw err;
        }else{
            if(result.length==0){
                sqlQuery = 'INSERT INTO tips_specification (name) VALUES (?)' ;
                con.query(sqlQuery,[spec], function (err, result, fields) {
                    if (err){
                        throw err;
                    }else{
                        return true;
                    } 
                });
            }else{
                return true;
            }
        } 
    });
}

function deleteSpec(oldSpec){
    let sqlQuery = 'Select * from health_tips WHERE specificationKey = ?' ;
    con.query(sqlQuery,[oldSpec], function (err, result, fields) {
        if (err){
            //console.log('spec added',err);
            throw err;
        }else{
            if(result.length<1){
                let sqlQuery = 'Delete from tips_specification  WHERE name = ?' ;
                con.query(sqlQuery,[oldSpec], function (err, result, fields){});
            }
        } 
    });
}

function getAllSpecification(tips_subcribed_ids){
    let sqlQuery = 'select * from tips_specification' ;
    return new Promise(function(resolve,reject){
        if(tips_subcribed_ids!=undefined&&tips_subcribed_ids.length>0){
            sqlQuery = 'select * from tips_specification where id IN ('+tips_subcribed_ids.join()+')' ;
        }
        con.query(sqlQuery,[], function (err, specificationsRes, fields) {
            if (err){
                resolve([]);
            }else{
                let specifications = [];
                specificationsRes.forEach(element => {
                    specifications.push({'name':element.name,'id':element.id})
                });
                resolve(specifications);
            } 
        });
    })
}

function getAllInsrnceProvider(){
    let sqlQuery = 'select * from insurance_provider' ;
    return new Promise(function(resolve,reject){
        con.query(sqlQuery,[], function (err, res, fields) {
            if (err){
                resolve([]);
            }else{
                let provider = [];
                res.forEach(element => {
                    provider.push({'provider_name':element.provider_name,'id':element.id})
                });
                resolve(provider);
            } 
        });
    })
}

function getAllSubcrbdSpecification(id){
    return new Promise(function(resolve,reject){
        let sqlQuery = 'select tips_subscribed from employee_general_detail where employee_id = ?' ;
        con.query(sqlQuery,[id], function (err, specificationsRes, fields) {
            if (err){
                resolve([]);
            }else{
                let tips_subcribed_ids = JSON.parse(specificationsRes[0]?specificationsRes[0].tips_subscribed:'[]');
                if(tips_subcribed_ids==null||tips_subcribed_ids==undefined||tips_subcribed_ids.length==0){
                    //console.log('getAllSubcrbdSpecification2');
                    resolve([]);
                }else{
                    getAllSpecification(tips_subcribed_ids).then(function(data){
                        resolve(data);
                    });
                }
            } 
        });
    });
}

function AddNewInsuranceProvider(provider){
    return new Promise(function(resolve,reject){
        let providerNameTemp = [];
        let values = '';
        let valuesString = '';
        let providerNameFinal = [];
        provider.forEach(element => {
            //if element in no means it is already present so skip
            if(isNaN(element)&&element!=''){
                providerNameTemp.push(ucfirst(element));
                values = values + '(?),';
                valuesString = valuesString +",'"+ ucfirst(element) +"'";
            }else{
                providerNameFinal.push(parseInt(element));
            }
        });
        if(providerNameTemp.length>0){
            values = values.slice(0, -1);
            valuesString = valuesString.slice(1);
            let sqlQuery = 'Insert INTO insurance_provider (provider_name) VALUES '+values ;
            con.query(sqlQuery,providerNameTemp, function (err, res, fields) {
                if (err){
                    reject(err);
                }else{
                    let sqlQuery = "select id from insurance_provider where provider_name IN ("+valuesString+")";
                    con.query(sqlQuery,providerNameTemp, function (err, res, fields) {
                        if (err){
                            reject(err);
                        }else{
                            res.forEach(element => {
                                providerNameFinal.push(element.id);
                            });
                            resolve(providerNameFinal);
                        }
                    });
                } 
            });
        }else{
            resolve(providerNameFinal);
        }
    })
}

function addInsrncePrvderContactMapping(contact_id,provider_ids){
    let values = '';
    provider_ids.forEach(element => {
        values = values + ',('+element+','+contact_id+')';
    });
    values = values.slice(1);
    let sqlQuery = 'Insert INTO contact_insurance_provider_mapping (provider_id,contact_id) VALUES '+values ;
    return new Promise(function(resolve,reject){
        con.query(sqlQuery,[], function (err, res, fields) {
            if (err){
                reject(err);
            }else{
                resolve(res);
            } 
        });
    })
}

function deleteInsrncePrvderContactMapping(contact_id){
    let sqlQuery = 'DELETE FROM contact_insurance_provider_mapping where contact_id = '+contact_id ;
    return new Promise(function(resolve,reject){
        con.query(sqlQuery,[], function (err, res, fields) {
            if (err){
                reject(err);
            }else{
                resolve(res);
            } 
        });
    })
}

function deleteFile(filePath){
    fs.exists(filePath, function(exists) {
        if(exists) {
            try {
                fs.unlinkSync(filePath);
                //console.log('successfully deleted '+filePath);
                return true;
            } catch (err) {
                return false;
            }
        } else {
            //console.log(gutil.colors.red('File not found, so not deleting.'));
            return false;
        }
    });
}

function ucfirst(str) {
    // let firstLetter = str.slice(0,1);
    // return firstLetter.toUpperCase() + str.substring(1);
    return str;
}

function capitalize(str) {
    // let pieces = str.split(" ");
    // for ( let i = 0; i < pieces.length; i++ ){
    //     let j = pieces[i].charAt(0).toUpperCase();
    //     pieces[i] = j + pieces[i].substr(1).toLowerCase();
    // }
    // return pieces.join(" ");
    return str;
}

function decryptData(Data) {
    return new Promise(function(resolve,reject) {
        if(Data){
            let decrypted = CryptoJS.AES.decrypt(Data,key, {keySize: 128 /8,iv: iv,mode: CryptoJS.mode.CBC,padding: CryptoJS.pad.Pkcs7});
			let cipherUsrCredentials = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
            resolve(cipherUsrCredentials);
        }else{
            resolve('');
        }
    });
}

function decryptDataString(Data) {
    return new Promise(function(resolve,reject) {
        if(Data){
            let decrypted = CryptoJS.AES.decrypt(Data,key, {keySize: 128 /8,iv: iv,mode: CryptoJS.mode.CBC,padding: CryptoJS.pad.Pkcs7});
			let cipherUsrCredentials = decrypted.toString(CryptoJS.enc.Utf8);
            resolve(cipherUsrCredentials);
        }else{
            resolve('');
        }
        
    });
}

function encryptData(Data) {
    return new Promise(function (resolve,reject) {
        if(Data){
            let text = JSON.stringify(Data);
            let encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text),key,{keySize: 128 /8,iv: iv,mode: CryptoJS.mode.CBC,padding: CryptoJS.pad.Pkcs7});
            text = encrypted.toString();
            //console.log('encryptData',text);
            resolve(text);
        }else{
            resolve('');
        }
    });
}

function SanitizeHtml(str){
    if(typeof str == 'string'){
        let strTemp = str.replace('<script>',"");
        strTemp = strTemp.replace('</script>',"");
        // strTemp = strTemp.replace('"',"&apos;");
        // strTemp = strTemp.replace("'","&apos;");
        return strTemp;
    }else{
        return str;
    }
}

exports.verifyAccessToken = (req,res,next)=>{
    let auth = req.get('Authorization');
    auth = auth?auth.split(" "):[];
    if(auth[1]==''||auth[1]==undefined){
        response(res,200,'',{'status':'Invalid'});
    }else{
        decryptDataString(auth[2]).then((employee_id)=>{
            jwt.verify(auth[1], privateKey, function(err, decoded) {
                //console.log('decoded',auth[1],auth[2],decoded,employee_id);
                if(decoded!=undefined&&decoded.employee_id==employee_id){
                    verifyTokenWithDb(employee_id,auth[1]).then((valid)=>{
                        if(valid){
                            decryptData(req.body.param).then((paramDecrpted)=>{
                                if(paramDecrpted.csrf=='Mahindra-HealthIndex'){
                                    let paramDecrptedTemp=[];
                                    Object.keys(paramDecrpted).forEach(function(key) {
                                        if(key!='csrf'){
                                            paramDecrptedTemp[key] = SanitizeHtml(paramDecrpted[key]);
                                        }
                                    })
                                    res.paramDecrpted = paramDecrptedTemp;
                                    next();
                                }else{
                                    response(res,200,'',{'status':'Unauthorised user.'});
                                }
                            });
                        }else{
                            response(res,200,'',{'status':'Access Token Expired'});
                        }
                    });
                }else{
                    response(res,200,'',{'status':'Access Token Expired'});
                }
            });
        });
    }
}

function storeToken(employee_id,token){
    return new Promise(function(resolve,reject) {
        let sqlQuery = "select employee_id from employee_general_detail where employee_id = (?)";
        con.query(sqlQuery,[employee_id], function (err, result, fields) {
            if(result&&result.length>0){
                sqlQuery = 'UPDATE employee_general_detail set token=? WHERE employee_id = ?' ;
            }else{
                sqlQuery = 'INSERT INTO employee_general_detail (token,employee_id) VALUES (?,?)' ;
            }
            console.log('storeToken',sqlQuery);
            con.query(sqlQuery,[token,employee_id], function (err, result, fields) {
                if (err){
                    resolve(true);
                }else{
                    resolve(false);
                } 
            });        
        });
    });
}

function verifyTokenWithDb(employee_id,token){
    return new Promise(function(resolve,reject) {
        let sqlQuery = "select token from employee_general_detail where employee_id = (?)";
        con.query(sqlQuery,[employee_id], function (err, result, fields) {
            //console.log('sent token',token,employee_id);
            //console.log('current token',result);
            if(result[0]&&token==result[0].token){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
}

//--------------------------------------------M setu -----------------------------------
exports.mSetu_insertIMEI= (req,res)=>{
    //console.log('mSetu_insertIMEI');
    var con = mysql.createPool({
        host: "localhost",
        port:"3306",
        user: "root",
        password: "Mahindra@123",
        database: "msetu_bot_db"
    });
   
    let name = req.body.title;
    let imei = req.body.imei?req.body.imei:'';
    var sqlQuery = "INSERT INTO user (name,imei) VALUES (?,?)"; 
    con.query(sqlQuery, [name,imei], function(err, rows, fields) {      
        if (err){
            res.status(400).json({
                'status':'failed'
            });
            throw err;
        }else{
            res.status(200).json({
                success:'success'
            });
        } 
    });
      
}

//------------------------------------outside--------------------------------------------
exports.getAllTipsOutSide = (req,res)=>{
    let parameters = req.body.param;//res.paramDecrpted;
    let fields = "* ";
    let select = "SELECT ";
    let from = " from health_tips WHERE 1=1";
    let where = "";
    let limit = "";
    let offset = "";
    let sort = " ORDER BY created_at DESC ";
    Object.keys(parameters).forEach(function(key) {
        if(key == 'fields'){
            fields = parameters[key];
        }else if(key == 'limit'){
            limit = " LIMIT  "+parameters[key];;
        }else if(key == 'offset'){
            offset = " OFFSET  "+parameters[key];;
        }else{
            if(parameters[key]&&parameters[key]!=''){
                where = where + " AND "+key+" LIKE '%"+parameters[key]+"%' ";
            }
        }
    });
    let sqlQuery = select+fields+from+where+sort+limit+offset;
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            result.forEach(element => {
                element["type"]="desc";
                if(element["image"]){
                    if(element["video"]){
                        if(element["video"].includes("/videos")){
                            element["type"]="image+video";
                        }else{
                            element["type"]="image+pdf";
                        }
                    }else{
                        element["type"]="image";
                    }
                }else if(element["video"]){
                    if(element["video"].includes("/videos")){
                        element["type"]="video";
                    }else{
                        element["type"]="pdf";
                    }
                }
            });
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}
//------------------------------------------blood bank------------------------------------------------//
exports.getBloodBankLocation = (req,res)=>{
    let sqlQuery = "SELECT DISTINCT blood_bank_location,blood_group FROM employee_general_detail where donate = 1 and blood_bank_location != '' ";
    con.query(sqlQuery,[], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.getEmpDetOut = (req,res) =>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id;
    if(employee_id==123456){
        let val = '{"employeenumber":123456,"name":"test","personnelarea":"CCRP","nameofpersarea":"Group Corporate Office","perssubarea":"2600","nameofperssubarea":"Mumbai, Sewri","employeegroup":"1","nameofempgroup":"Permanent","employeesubgroup":"A7","nameofempsubgroup":"L5-Department Head","orgunit":50015956,"nameoforgunit":"BUSINESS SOLUTIONS","position":70003175,"nameofposition":"DY.GENERAL MANAGER - CORP","costcenter":"0000852400","nameofcostcenter":"CORPORATE IT DEP EXP","companycode":"1001","nameofcompanycode":"Mahindra & Mahindra Ltd","firstname":"Mangesh Ramakant","lastname":"Nagle","empSex":"Male","mgrId":210613,"mgrEmail":"210613@MAHINDRA.COM","mgrName":"Chavan Sanjay","empMobile":"919820547594","empEmail":"123456@MAHINDRA.COM","empSfFlag":"SF","empCtcApproverFlag":"NEGATIVE","empMdmApproverFlag":"NO"}';	
		response(res,200,'',{'status':'success','data':val});
    }else{
        requestify.get('https://emss.mahindra.com/sap/bc/zzhr_chk_sf_emp?sap-client=500&empid='+employee_id).then(function(result) {
            // Get the response body (JSON parsed - JSON response or jQuery object in case of XML response)
            result.getBody();
            // Get the response raw body
            let val = result.body;
            response(res,200,'',{'status':'success','data':val});
        },err=>{
            response(res,200,'',{'status':'success','data':{}});
        });
    }
}

exports.getDonors = (req,res) =>{
    let parameters = res.paramDecrpted;
    let fields = "";
    let select = "SELECT ";
    let from = " from employee_general_detail as cl ";
    let where = "WHERE 1=1  and donate=1 ";
    let limit = "";
    let offset = "";
    Object.keys(parameters).forEach(function(key) {
        if(key == 'fields'){
            fields = parameters[key];
        }else if(key == 'limit'){
            limit = " LIMIT  "+parameters[key];;
        }else if(key == 'offset'){
            offset = " OFFSET  "+parameters[key];;
        }else{
            if(parameters[key]&&parameters[key]!=''){
                if(key=='city'){
                    let city = parameters[key].join("','");
                    where = where + " AND "+key+" In('"+city+"') ";
                }else{
                    where = where + " AND "+key+" LIKE '%"+parameters[key]+"%' ";
                }
            }
        }
    });
    let sqlQuery = select+fields+from+where+limit+offset;
    console.log('getDonors',parameters,sqlQuery);
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        }
    });
}
//personal health
exports.addPersonalHealthDetails = (req,res) =>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id?parameters.employee_id:'';
    let sugar_fasting = parameters.sugar_fasting?parameters.sugar_fasting:'';
    let sugar_pp = parameters.sugar_pp?parameters.sugar_pp:'0';
    let systolic = parameters.systolic?parameters.systolic:'null';
    let diastolic = parameters.diastolic?parameters.diastolic:'0';
    let total_cholesterol = parameters.total_cholesterol?parameters.total_cholesterol:'0';
    let hdl = parameters.hdl?parameters.hdl:'0';
    let ldl = parameters.ldl?parameters.ldl:'0';
    let triglycerides = parameters.triglycerides?parameters.triglycerides:'0';
    let weight = parameters.weight?parameters.weight:'0';
    let waist = parameters.waist?parameters.waist:'0';
    let month = parameters.month?parameters.month:'';
    let year = parameters.year?parameters.year:'';
    let date = parameters.date?parameters.date+" 12:00:00.000":'';
    let quater = parameters.quater?parameters.quater:'';
    let to_date = parameters.to_date?parameters.to_date+" 12:00:00.000":'';
    let type = parameters.type?parameters.type:'';
    let preference = parameters.preference?parameters.preference:'';
    //date ='2019-11-24T00:00:00.000Z';
    //to_date = '2019-11-24T00:00:00.000Z';
    let sqlQuery = "select * from employee_personal_health_details where employee_id = "+employee_id+" and date = '"+date+"' and to_date = '"+to_date+"'";
    //console.log('query',sqlQuery);
    con.query(sqlQuery, [], function(err, result, fields) {    
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            let column = '';let values='';
            let param = [];
            if(result.length>0){
                console.log('update id',result[0].id);
                let id = result[0].id;
                if(type=='bs'){
                    column = 'sugar_fasting = ?,sugar_pp= ?';
                    param = [sugar_fasting,sugar_pp,id];
                }else if(type=='bp'){
                    column = 'systolic = ?,diastolic = ?';
                    param = [systolic,diastolic,id];
                }else if(type=='cholesterol'){
                    column = 'total_cholesterol = ?,hdl = ?,ldl = ?';
                    param = [total_cholesterol,hdl,ldl,id];
                }else if(type=='triglycerides'){
                    column = 'triglycerides = ?';
                    param = [triglycerides,id];
                }else if(type=='weight'){
                    column = 'weight = ?';
                    param = [weight,id];
                }else if(type=='waist'){
                    column = 'waist = ?';
                    param = [waist,id];
                }
                sqlQuery = "UPDATE employee_personal_health_details set "+column+" WHERE id = ?";
            }else{
                console.log('insert');
                sqlQuery = "INSERT INTO employee_personal_health_details (employee_id,";
                if(type=='bs'){
                    column = 'sugar_fasting,sugar_pp';
                    values =  '?,?';
                    param = [employee_id,sugar_fasting,sugar_pp,month,year,date,to_date,quater,preference];
                }else if(type=='bp'){
                    column = 'systolic,diastolic';
                    values =  '?,?';
                    param = [employee_id,systolic,diastolic,month,year,date,to_date,quater,preference];
                }else if(type=='cholesterol'){
                    column = 'total_cholesterol,hdl,ldl';
                    values =  '?,?,?';
                    param = [employee_id,total_cholesterol,hdl,ldl,month,year,date,to_date,quater,preference];
                }else if(type=='triglycerides'){
                    column = 'triglycerides';
                    values =  '?';
                    param = [employee_id,triglycerides,month,year,date,to_date,quater,preference];
                }else if(type=='weight'){
                    column = 'weight';
                    values =  '?';
                    param = [employee_id,weight,month,year,date,to_date,quater,preference];
                }else if(type=='waist'){
                    column = 'waist';
                    values =  '?';
                    param = [employee_id,waist,month,year,date,to_date,quater,preference];
                }

                column = column+",month,year,date,to_date,quater,preference) VALUES (?,?,?,"+values+",?,?,?,?)";
                sqlQuery +=column;
            }
            console.log('query',sqlQuery);
            con.query(sqlQuery, param, function(err, result, fields) {       
                if (err){
                    response(res,400,err,{'status':'failed'});
                }else{
                    response(res,200,'',{'status':'success'});
                } 
            });
        } 
    });

}

exports.getPersonalHealthDetails = (req,res) =>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id?parameters.employee_id:'';
    let year = parameters.year?parameters.year:'';
    let month = parameters.month?parameters.month:'';
    let type = parameters.type?parameters.type:'';
    let reportType = parameters.reportType?parameters.reportType:'';
    let sqlQuery = "select ";
    let SelectParam = "*";
    let from = " from employee_personal_health_details "
    let where = "where employee_id = "+employee_id;
    let sortBy = " ORDER BY date";
    let groupBy = '';

    if(type=="daily"){
        where += " AND month = "+month+" AND year = "+year;
    }else if(type=="monthly"){
        where += " AND year = "+year;
        groupBy = " GROUP BY month";
    }else if(type=="yearly"){
        groupBy = " GROUP BY year";
    }

    if(reportType=='bs'){
        if(type=='monthly'||type=='yearly'){
            SelectParam = " ROUND(AVG(sugar_fasting)) as sugar_fasting, ROUND(AVG(sugar_pp)) as sugar_pp";
        }
        where += " AND sugar_fasting is NOT NUll";
    }if(reportType=='bmi'){
        if(type=='monthly'||type=='yearly'){
            SelectParam = "ROUND(AVG(weight)) as weight";
        }
        where += " AND weight is NOT NUll";
    }else if(reportType=='bp'){
        if(type=='monthly'||type=='yearly'){
            SelectParam = "ROUND(AVG(diastolic)) as diastolic,ROUND(AVG(systolic)) as systolic";
        }
        where += " AND systolic is NOT NUll";
    }else if(reportType=='cholesterol'){
        if(type=='monthly'||type=='yearly'){
            SelectParam = "ROUND(AVG(total_cholesterol)) as total_cholesterol,ROUND(AVG(ldl)) as ldl,ROUND(AVG(hdl)) as hdl";
        }
        where += " AND total_cholesterol is NOT NUll";
    }else if(reportType=='triglycerides'){
        if(type=='monthly'||type=='yearly'){
            SelectParam = "ROUND(AVG(triglycerides)) as 	triglycerides";
        }
        where += " AND triglycerides is NOT NUll";
    }else if(reportType=='waist'){
        if(type=='monthly'||type=='yearly'){
            SelectParam = "ROUND(AVG(waist)) as waist";
        }
        where += " AND waist is NOT NUll";
    }
    SelectParam += ',date,year,month';
    sqlQuery = sqlQuery+SelectParam+from+where+groupBy+sortBy;
    console.log('getPersonalHealthDetails',sqlQuery);
    con.query(sqlQuery, [], function(err, result, fields) {       
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        } 
    });
}

exports.getMahindraHealthReport = (req,res) =>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id?parameters.employee_id:'';
    let year = parameters.year?parameters.year:'';
    let url = 'http://10.2.206.216:3000/PDF?empId=?'+employee_id+'&year='+year;
    //url = 'http://10.2.206.216:3000/PDF?empId=21649&year=2015';
    console.log(url);
    requestify.get(url).then(function(result) {
		console.log('getMahindraHealthReport success');
        // Get the response body (JSON parsed - JSON response or jQuery object in case of XML response)
        result.getBody();
        // Get the response raw body
        let val = JSON.parse(result.body);
        response(res,200,'',{'status':'success','data':val});
    },err=>{
		console.log('getMahindraHealthReport',err);
        response(res,200,'',{'status':'success','data':{}});
    });
}
//------------------------------------willing to donate --------------------------------------------------------------
exports.addUpdateWillingToDonateInfo = (req,res)=>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id?parameters.employee_id:'';
    let employee_name = parameters.employee_name?parameters.employee_name:'';
    let address = parameters.address?parameters.address:'';
    let present_address = parameters.present_address?parameters.present_address:'';
    let contact = parameters.contact?parameters.contact:'';
    let designation = parameters.designation?parameters.designation:'';
    let mail_id = parameters.mail_id?parameters.mail_id:'';
    let nameofcostcenter = parameters.nameofcostcenter?parameters.nameofcostcenter:'';
    let willing_to_help = parameters.willing_to_help?parameters.willing_to_help:0;willing_to_help = willing_to_help?1:0;
    getlatLong(present_address).then(function(data){
        let latLong = data;
        let param = [employee_name,address,present_address,contact,designation,mail_id,nameofcostcenter,willing_to_help,latLong.lat,latLong.lng,employee_id];
        let sqlQuery = 'SELECT * from willing_to_help where employee_id = ?' ;
        //console.log('param',param);
        con.query(sqlQuery,[employee_id], function (err, result, fields) {
            if (err){
                response(res,400,err,{'status':'failed'});
            }else{
                if(result.length==0){
                    sqlQuery = 'INSERT INTO willing_to_help (employee_name,address,present_address,contact,designation,mail_id,nameofcostcenter,willing_to_help,latitude,longitude,employee_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)' ;
                }else{
                    sqlQuery = 'UPDATE willing_to_help set employee_name=?,address=?,present_address=?,contact=?,designation=?,mail_id=?,nameofcostcenter=?,willing_to_help=?,latitude=?,longitude=? WHERE employee_id = ?' ; 
                }
                con.query(sqlQuery,param, function (err, result, fields) {
                    if (err){
                        response(res,400,err,{'status':'failed'});
                    }else{
                        response(res,200,'',{'status':'success'});
                    } 
                });
            } 
        });
    });
}

exports.gethelpers = (req,res) =>{
	console.log('gethelpers api',req.headers.origin);
    let parameters = res.paramDecrpted;
    let fields = "";
    let select = "SELECT ";
    let from = " from willing_to_help as cl ";
    let where = "WHERE 1=1  and willing_to_help = 1 ";
    let limit = "";
    let offset = "";
    Object.keys(parameters).forEach(function(key) {
        if(key == 'fields'){
            fields = parameters[key];
        }else if(key == 'limit'){
            limit = " LIMIT  "+parameters[key];;
        }else if(key == 'offset'){
            offset = " OFFSET  "+parameters[key];;
        }else{
            if(parameters[key]&&parameters[key]!=''){
                if(key=='city'){
                    let city = parameters[key].join("','");
                    where = where + " AND "+key+" In('"+city+"') ";
                }if(key=='latLng'){
                    if(parameters[key].lat){
                        var lat=parseFloat(parameters[key].lat);
                        var long=parseFloat(parameters[key].lng);
                        var radiusInKm=5;
                        kmInLongitudeDegree = 111.320 * Math.cos( lat / 180.0 * Math.PI )
                        deltaLat = radiusInKm / 111.1;
                        deltaLong = radiusInKm / kmInLongitudeDegree;
                        minLat = lat - deltaLat;  
                        maxLat = lat + deltaLat;
                        minLong = long - deltaLong; 
                        maxLong = long + deltaLong;
                        //console.log(lat,long);
                        //console.log("maxLat "+maxLat+"maxLong "+maxLong+"minLat "+minLat+"minLong "+minLong);
                        where = where + 'AND latitude BETWEEN '+minLat+' AND '+maxLat+' AND longitude BETWEEN '+ minLong+' AND '+maxLong;
                    }
                }else if(key=="employee_id"){
                    where = where + " AND employee_id <>"+parameters[key];
                }else{
                    where = where + " AND "+key+" LIKE '%"+parameters[key]+"%' ";
                }
            }
        }
    });
    
    let sqlQuery = select+fields+from+where+limit+offset;
    //console.log('getDonors',parameters,sqlQuery);
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            response(res,200,'',{'status':'success','data':result});
        }
    });
}

exports.getEmpDetOutWillingToHelp = (req,res) =>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id;
    if(employee_id==123456){
        let val = '{"employeenumber":123456,"name":"test","personnelarea":"CCRP","nameofpersarea":"Group Corporate Office","perssubarea":"2600","nameofperssubarea":"Mumbai, Sewri","employeegroup":"1","nameofempgroup":"Permanent","employeesubgroup":"A7","nameofempsubgroup":"L5-Department Head","orgunit":50015956,"nameoforgunit":"BUSINESS SOLUTIONS","position":70003175,"nameofposition":"DY.GENERAL MANAGER - CORP","costcenter":"0000852400","nameofcostcenter":"CORPORATE IT DEP EXP","companycode":"1001","nameofcompanycode":"Mahindra & Mahindra Ltd","firstname":"Mangesh Ramakant","lastname":"Nagle","empSex":"Male","mgrId":210613,"mgrEmail":"210613@MAHINDRA.COM","mgrName":"Chavan Sanjay","empMobile":"919820547594","empEmail":"123456@MAHINDRA.COM","empSfFlag":"SF","empCtcApproverFlag":"NEGATIVE","empMdmApproverFlag":"NO"}';	
		response(res,200,'',{'status':'success','data':val});
    }else{
        let sqlQuery = 'SELECT * from willing_to_help where employee_id = ?' ;
        con.query(sqlQuery,[employee_id], function (err, result, fields) {
            if (err){
                response(res,400,err,{'status':'failed'});
            }else{
                if(result.length>0){
                    //console.log(result[0].nameofcostcenter);
                    if(result[0].nameofcostcenter){
                        response(res,200,'',{'status':'success','data':result[0]});
                    }else{
                        requestify.get('https://emss.mahindra.com/sap/bc/zzhr_chk_sf_emp?sap-client=500&empid='+employee_id).then(function(resultEmp) {
                            resultEmp.getBody();
                            var val1 = JSON.parse(resultEmp.body);
                            result[0].nameofcostcenter = val1.nameofcostcenter;
                            //console.log(result[0]);
                            response(res,200,'',{'status':'success','data':result[0]});
                        });
                    }
                }else{
                    requestify.get('https://emss.mahindra.com/sap/bc/zzhr_chk_sf_emp?sap-client=500&empid='+employee_id).then(function(result) {
                        // Get the response body (JSON parsed - JSON response or jQuery object in case of XML response)
                        result.getBody();
                        // Get the response raw body
                        var val1 = JSON.parse(result.body);
                        //let url = 'https://api4.successfactors.com/odata/v2/PerAddressDEFLT?$select=addressType,personIdExternal,startDate,address1,address10,address11,address12,address13,address2,address20,address3,address4,address5,address6,address7,address8,address9,attachmentId,city,country,county,customString1,province,state,zipCode&$filter=personIdExternal%20eq%20%27'+employee_id+'%27&$format=json';
                        let url = 'https://api4.successfactors.com/odata/v2/PerAddressDEFLT?$select=addressType,personIdExternal,startDate,address1,address3,address2,customString1,address4,address5,cityNav/picklistLabels/label,countryNav/territoryName,countyNav/picklistLabels/label,stateNav/picklistLabels/label,zipCode&$expand=cityNav/picklistLabels,countryNav,countyNav/picklistLabels,stateNav/picklistLabels&$filter=personIdExternal%20eq%20%27'+employee_id+'%27&$format=json'
                        let User = 'meconnect_api@Mahindra';
                        requestify.request(url, {method: 'GET',auth: {username: User,password: "Mahindra@123"}}).then(function(result) {
                            result.getBody();

                            let val = JSON.parse(result.body);
                            val = val.d.results[0];

                            let state = val.stateNav.picklistLabels.results[0].label;
                            let country = val.countryNav.territoryName;
                            let city = val.cityNav.picklistLabels.results[0].label;
                            let address = val.address1;
                            address += val.address2?', '+val.address2:'';
                            address += val.address3?', '+val.address3:'';
                            address += val.address4?', '+val.address4:'';
                            address += val.address5?', '+val.address5:'';
                            address += val.address6?', '+val.address6:'';
                            address += val.address7?', '+val.address7:'';
                            address += val.address8?', '+val.address8:'';
                            address += val.address9?', '+val.address9:'';
                            address += city?', '+city:'';
                            address += val.zipCode?', '+val.zipCode:'';
                            
                            let finalRes = {
                                employee_id:val1.employeenumber,
                                employee_name:val1.name,
                                contact: val1.empMobile,
                                address: address,
                                mail_id: val1.empEmail,
                                nameofcostcenter: val1.nameofcostcenter,
                                designation: val1.nameofposition,
                                willing_to_help: 0,
                                present_address: "",
                                state:state,
                                city:city,
                                country:country
                            }
                            //console.log('result here 3',finalRes);
                            response(res,200,'',{'status':'success','data':finalRes});
                        },err=>{
                            //console.log('amol err',err);
                            response(res,200,'',{'status':'success','data':{}});
                        });
                    },err=>{
                        response(res,200,'',{'status':'success','data':{}});
                    });
                }
            }
        });
    }
}

exports.getEmpDetOutWillingToHelpNew = (req,res) =>{
    let parameters = res.paramDecrpted;
    let employee_id = parameters.employee_id;
    let SapUserInfoUrl = 'https://emss.mahindra.com/sap/bc/zzhr_chk_sf_emp?sap-client=500&empid='+employee_id;
    let Sapurl = 'https://api4.successfactors.com/odata/v2/PerAddressDEFLT?$select=addressType,personIdExternal,startDate,address1,address3,address2,customString1,address4,address5,cityNav/picklistLabels/label,countryNav/territoryName,countyNav/picklistLabels/label,stateNav/picklistLabels/label,zipCode&$expand=cityNav/picklistLabels,countryNav,countyNav/picklistLabels,stateNav/picklistLabels&$filter=personIdExternal%20eq%20%27'+employee_id+'%27&$format=json'
    let SapUser = 'meconnect_api@Mahindra';
    let SapPass = 'Mahindra@123';
    let sqlQuery = 'SELECT * from willing_to_help where employee_id = ?' ;
    con.query(sqlQuery,[employee_id], function (err, result, fields) {
        if (err){
            response(res,400,err,{'status':'failed'});
        }else{
            if(result.length>0){
                requestify.request(Sapurl, {method: 'GET',auth: {username: SapUser,password: SapPass}}).then(function(Addressresult) {
                    Addressresult.getBody();
                    let val = JSON.parse(Addressresult.body);
                    val = val.d.results[0];
                    let state = val.stateNav.picklistLabels.results[0].label;
                    let country = val.countryNav.territoryName;
                    let city = val.cityNav.picklistLabels.results[0].label;
                    let pincode = val.zipCode;
                    let address = val.address1;
                    address += val.address2?', '+val.address2:'';
                    address += val.address3?', '+val.address3:'';
                    address += val.address4?', '+val.address4:'';
                    address += val.address5?', '+val.address5:'';
                    address += val.address6?', '+val.address6:'';
                    address += val.address7?', '+val.address7:'';
                    address += val.address8?', '+val.address8:'';
                    address += val.address9?', '+val.address9:'';
                    
                    result[0].address = address;
                    result[0].address_state=state;
                    result[0].address_city=city;
                    result[0].address_country=country;
                    result[0].address_pincode=pincode;

                    let present_addressArray = result[0].present_address.split(',');
                    result[0].present_city = present_addressArray[present_addressArray.length-2];
                    result[0].present_pincode = present_addressArray[present_addressArray.length-1];
                    present_addressArray = present_addressArray.splice(0,present_addressArray.length-2);
                    result[0].present_address = present_addressArray.join();

                    if(result[0].nameofcostcenter){
                        response(res,200,'',{'status':'success','data':result[0]});
                    }else{
                        requestify.get(SapUserInfoUrl).then(function(resultEmp) {
                            resultEmp.getBody();
                            var val1 = JSON.parse(resultEmp.body);
                            result[0].nameofcostcenter = val1.nameofcostcenter;
                            response(res,200,'',{'status':'success','data':result[0]});
                        });
                    }
                },err=>{
                    console.log('err',err);
                    response(res,200,'',{'status':'success','data':{}});
                });
            }else{
                requestify.get(SapUserInfoUrl).then(function(result) {
                    result.getBody();
                    var val1 = JSON.parse(result.body);
                    requestify.request(Sapurl, {method: 'GET',auth: {username: SapUser,password: SapPass}}).then(function(result) {
                        result.getBody();
                        let val = JSON.parse(result.body);
                        val = val.d.results[0];
                        let state = val.stateNav.picklistLabels.results[0].label;
                        let country = val.countryNav.territoryName;
                        let city = val.cityNav.picklistLabels.results[0].label;
                        let pincode = val.zipCode;
                        let address = val.address1;
                        address += val.address2?', '+val.address2:'';
                        address += val.address3?', '+val.address3:'';
                        address += val.address4?', '+val.address4:'';
                        address += val.address5?', '+val.address5:'';
                        address += val.address6?', '+val.address6:'';
                        address += val.address7?', '+val.address7:'';
                        address += val.address8?', '+val.address8:'';
                        address += val.address9?', '+val.address9:'';
                        
                        let finalRes = {
                            employee_id:val1.employeenumber,
                            employee_name:val1.name,
                            contact: val1.empMobile,
                            address: address,
                            mail_id: val1.empEmail,
                            nameofcostcenter: val1.nameofcostcenter,
                            designation: val1.nameofposition,
                            willing_to_help: 0,
                            present_address: "",
                            address_state:state,
                            address_city:city,
                            address_country:country,
                            address_pincode:pincode,
                            present_city:'',
                            present_pincode:''
                        }
                        response(res,200,'',{'status':'success','data':finalRes});
                    },err=>{
                        console.log('err',err);
                        response(res,200,'',{'status':'success','data':{}});
                    });
                },err=>{
                    response(res,200,'',{'status':'success','data':{}});
                });
            }
        }
    });
    
}

function getlatLong(address){
    return new Promise(function(resolve,reject){
		address = address.split(',').reverse().join();
        let latLongUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&key=AIzaSyCpFuGsz_ZjM5sN-Sjaro_71dcT8nejnXw&components=country:IN';
        requestify.get(latLongUrl).then(function(result) {
            // Get the response body (JSON parsed - JSON response or jQuery object in case of XML response)
            result.getBody();
            // Get the response raw body
            //console.log(JSON.parse(result.body).results[0].geometry.location);
            let latLongApiRes = JSON.parse(result.body).results[0];
            let latlong = latLongApiRes.geometry?latLongApiRes.geometry.location:{};
            resolve(latlong);
            //https://maps.googleapis.com/maps/api/geocode/json?address=A/201 Narita Apts Yari Galli, Behind Ashok Honda Bungalow Yari Road, Mumbai, 400061&key=AIzaSyCpFuGsz_ZjM5sN-Sjaro_71dcT8nejnXw
        },err=>{
            resolve({});
        });
    })
}

function distance(lat2,lon2) {
    let lat1 = this.latlng.lat;
    let lon1 = this.latlng.lng;
    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    var dist ;
    if (d>1){
      dist = Math.round(d)+"km";
    }else{
      dist  = Math.round(d*1000)+"mtr"
    };
    //console.log('distance',dist);
    return dist;
}

exports.wilingToHelpCount = (req,res)=>{
	let sqlQuery = 'select COUNT(*) as count from willing_to_help';
	con.query(sqlQuery, function (err, result, fields) {
		if (err){
			res.status(400).json({'status':'failed'});
		}else{
			let total = result[0].count;
			let sqlQuery = 'select COUNT(*) as count from willing_to_help where willing_to_help = 1';
			con.query(sqlQuery, function (err, result2, fields) {
				if (err){
					res.status(400).json({'status':'failed'});
				}else{
					let totalWillingToDnt = result2[0].count;
					res.status(200).json({'status':'success','data':{total:total,totalWillingToDnt:totalWillingToDnt}});
				}
			});
		}
	});
}
 
exports.wilingToHelpHelperData = (req,res)=>{
	let sqlQuery = '';
	if(req.query.id){
		sqlQuery = 'select * from willing_to_help where employee_id='+req.query.id;
	}else{
		sqlQuery = 'select * from willing_to_help where employee_name LIKE "%'+req.query.name+'%"';
	}
	con.query(sqlQuery, function (err, result, fields) {
		if (err){
			res.status(400).json({'status':'failed'});
		}else{
			res.status(200).json({'status':'success','data':result});
		}
	});
}

exports.wilingToHelpHelperDataCsv = (req,res)=>{
    let sqlQuery = '';
    let fields = 'employee_name,employee_id,designation,mail_id,nameofcostcenter';
    let select = 'select '+fields+' from willing_to_help where 1=1';
    let where = ' AND willing_to_help=1'
    if(req.query.id){
        where += ' AND employee_id='+req.query.id;
    }else if(req.query.id){
        where += ' AND employee_name LIKE "%'+req.query.name+'%"';
    }else if(req.query.to&&req.query.from){
        where += ' AND created_at >="'+req.query.from+'" and created_at <="'+req.query.to+'"';
    }else if(req.query.to){
        where += ' AND created_at <="'+req.query.to+'"';
    }else if(req.query.from){
        where += ' AND created_at >="'+req.query.from+'"';
    }else if(req.query.date){
        let strtTime = '00:00:00';
        let sendTime = '24:00:00';
        where += ' AND created_at >="'+req.query.date+" "+strtTime+'" and created_at <="'+req.query.date+" "+sendTime+'"';
    }
    sqlQuery = select+where;
    //console.log(sqlQuery);
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            res.status(400).json({'status':'failed'});
        }else{
            const csvData = csvjson.toCSV(result,{
                headers: 'key'
            });
            let d = new Date();
            let timestamp = d.getTime();
            let fileName = 'willing-to-help'+timestamp+'.csv';
            fs.appendFile(fileName, 'Hello content!', function (err) {
                if (err) throw err;
                writeFile('./uploads/csv/'+fileName, csvData, (err) => {
                    if(err) {
                        console.log(err); // Do something to handle the error or just throw it
                        throw new Error(err);
                    }
                    //console.log('Success!');
                    res.set('Content-Type', 'text/csv');
                    //res.setHeader('Content-disposition', 'attachment; filename=\amol.csv');
                    res.download('./uploads/csv/'+fileName, fileName); 
                    //res.status(200).json({'status':'CSV Donwnloading, Please wait it will take a while...'});
                });
            });
        }
    });
}

exports.wilingToHelpUpdateLatLng = (req,res)=>{
    let sqlQuery = 'select * from willing_to_help limit '+req.query.limit+' offset '+req.query.offset;
    var updatedData=[];
    var errorUpdating=[];
	console.log(sqlQuery);
    con.query(sqlQuery, function (err, result, fields) {
        if (err){
            res.status(400).json({'status':'failed'});
        }else{
            result.forEach((element,key) => {
                getlatLong(element.present_address).then(function(data){
                    let latLong = data;
                    sqlQuery = 'update willing_to_help set latitude='+latLong.lat+',longitude='+latLong.lng+' where id='+element.id;
                    //console.log(sqlQuery);
					setTimeout(()=>{
						con.query(sqlQuery,[], function (err, result2, fields2) {
							if (err){
								//console.log('err',element.id);
								errorUpdating.push(element.id);
							}else{
								//console.log(element.id);
								updatedData.push(element.id);
							} 
							if(result.length==key+1){
								console.log('length',updatedData.length,errorUpdating.length);
								res.status(200).json({'status':'success','updatedData':updatedData,'errorUpdating':errorUpdating,'length':updatedData.length});
							}
						});
					},3000);
                    
                });
            });
        }
    });
}




