const express = require("express");
const router = express.Router();

var controllerGetpost = require('../controller/getpost.js');

router.get("/",controllerGetpost.test);
router.post("/login",controllerGetpost.login);
router.post("/logout",controllerGetpost.verifyAccessToken,controllerGetpost.logout);
router.post("/getAllDetails",controllerGetpost.verifyAccessToken,controllerGetpost.getAllDetails);
router.post("/getGenDetails",controllerGetpost.verifyAccessToken,controllerGetpost.getGenDetails);
//personal info
router.post("/addUpdatePersonalInfo",controllerGetpost.verifyAccessToken,controllerGetpost.addUpdatePersonalInfo);
//health parameters 
router.post("/getHealthParamInfo",controllerGetpost.verifyAccessToken,controllerGetpost.getHealthParamInfo);
router.post("/updateHealthParamInfo",controllerGetpost.verifyAccessToken,controllerGetpost.updateHealthParamInfo);
//policy provider
router.post("/getPolicyProviderInfo",controllerGetpost.verifyAccessToken,controllerGetpost.getPolicyProviderInfo);
router.post("/updatePolicyProviderInfo",controllerGetpost.verifyAccessToken,controllerGetpost.updatePolicyProviderInfo);
router.post("/getAllInsrnceProvider",controllerGetpost.verifyAccessToken,controllerGetpost.getAllInsrnceProvider);
router.post("/addNewInsuranceProvider",controllerGetpost.verifyAccessToken,controllerGetpost.addNewInsuranceProvider);
//tips related API's
router.post("/getAllTips",controllerGetpost.verifyAccessToken,controllerGetpost.getAllTips);
router.post("/addTips",controllerGetpost.addTips);
router.post("/deleteTipsDetail",controllerGetpost.verifyAccessToken,controllerGetpost.deleteTipsDetail);
router.post("/updateTipsDetail",controllerGetpost.updateTipsDetail);
router.post("/getTipsWithAllSpecification",controllerGetpost.verifyAccessToken,controllerGetpost.getTipsWithAllSpecification);
router.post("/updateTipsSubcribe",controllerGetpost.verifyAccessToken,controllerGetpost.updateTipsSubcribe);
router.post("/publishTip",controllerGetpost.verifyAccessToken,controllerGetpost.publishTip);
router.post("/getAllSpecification",controllerGetpost.verifyAccessToken,controllerGetpost.getAllSpecificationApi);
//contact related API's
router.post("/getAllContact",controllerGetpost.verifyAccessToken,controllerGetpost.getAllContact);
router.post("/getContactsOfeachCategory",controllerGetpost.verifyAccessToken,controllerGetpost.getContactsOfeachCategory);
router.post("/createContactDetail",controllerGetpost.verifyAccessToken,controllerGetpost.createContactDetail);
router.post("/deleteContactDetail",controllerGetpost.verifyAccessToken,controllerGetpost.deleteContactDetail);
router.post("/updateContactDetail",controllerGetpost.verifyAccessToken,controllerGetpost.updateContactDetail);
router.post("/publishContact",controllerGetpost.verifyAccessToken,controllerGetpost.publishContact);
//annual report
router.post("/annualReport",controllerGetpost.verifyAccessToken,controllerGetpost.annualReport);
router.post("/addReport",controllerGetpost.verifyAccessToken,controllerGetpost.addReport);
router.post("/deleteReport",controllerGetpost.verifyAccessToken,controllerGetpost.deleteReport);
router.post("/getMahindraHealthReport",controllerGetpost.verifyAccessToken,controllerGetpost.getMahindraHealthReport);
//for econnect
router.post("/annualReport_econn",controllerGetpost.annualReport_econn);
router.post("/addReport_econn",controllerGetpost.addReport_econn);
router.post("/deleteReport_econn",controllerGetpost.deleteReport_econn);
//mahindra locations
router.post("/getMahindraLocation",controllerGetpost.verifyAccessToken,controllerGetpost.getMahindraLocation);
//personal health details
router.post("/addPersonalHealthDetails",controllerGetpost.verifyAccessToken,controllerGetpost.addPersonalHealthDetails);
router.post("/getPersonalHealthDetails",controllerGetpost.verifyAccessToken,controllerGetpost.getPersonalHealthDetails);
//mSetu
router.post("/mSetu_insertIMEI",controllerGetpost.mSetu_insertIMEI);
//
router.post("/getAllTipsOutSide",controllerGetpost.getAllTipsOutSide);

//blood bank API's
router.post("/getBloodBankLocation",controllerGetpost.verifyAccessToken,controllerGetpost.getBloodBankLocation);
router.post("/getEmpDetOut",controllerGetpost.verifyAccessToken,controllerGetpost.getEmpDetOut);
router.post("/getDonors",controllerGetpost.verifyAccessToken,controllerGetpost.getDonors);
//willing to help
router.post("/addUpdateWillingToDonateInfo",controllerGetpost.verifyAccessToken,controllerGetpost.addUpdateWillingToDonateInfo);
router.post("/gethelpers",controllerGetpost.verifyAccessToken,controllerGetpost.gethelpers);
router.post("/getEmpDetOutWillingToHelp",controllerGetpost.verifyAccessToken,controllerGetpost.getEmpDetOutWillingToHelp);
router.post("/getEmpDetOutWillingToHelpNew",controllerGetpost.verifyAccessToken,controllerGetpost.getEmpDetOutWillingToHelpNew);

router.get("/wilingToHelpCount",controllerGetpost.wilingToHelpCount);
router.get("/wilingToHelpHelperData",controllerGetpost.wilingToHelpHelperData);
router.get("/wilingToHelpHelperDataCsv",controllerGetpost.wilingToHelpHelperDataCsv);
router.get("/wilingToHelpUpdateLatLng",controllerGetpost.wilingToHelpUpdateLatLng);

//emmss
router.get("/emssEmpData",controllerGetpost.emssEmpData);
module.exports = router;



