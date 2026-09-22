const SPREADSHEET_ID = "1GwwZttDCcx88JSHxny84jlyCyImg-j5RzGPAckaIZ68";
const SHEET_NAME = "Responses";
const MAX_BODY_LENGTH = 20000;
const MAX_ORGANIZATION_LENGTH = 200;
const MAX_CONTACT_NAME_LENGTH = 200;
const MAX_OTHER_STAKEHOLDER_LENGTH = 100;
const MAX_OTHER_CLIMATE_ACTION_LENGTH = 500;
const MAX_SUGGESTION_LENGTH = 5000;
const ALLOWED_STAKEHOLDER_TYPES = ["Customer", "Supplier", "Government", "Other"];
const ALLOWED_EXPECTATIONS = ["Energy", "GHG", "Waste", "Chemical", "Water", "Procurement", "Air", "Biodiversity", "Natural", "Pollution", "Control"];
const ALLOWED_REQUIREMENTS = ["ISO14001", "EnergyPolicy", "CarbonReduction", "WasteReduction", "ChemicalControl", "WaterManagement", "PollutionControl", "BiodiversityProtection"];
const ALLOWED_CLIMATE_ACTIONS = ["GHGReporting", "ISO14001GreenIndustry", "CleanEnergy", "CarbonNeutralNetZero", "GreenProcurement", "Other"];

const STAKEHOLDER_TEXT = {
  Customer: "ลูกค้า / ผู้รับบริการ",
  Supplier: "ผู้ส่งมอบ / ผู้รับเหมา / ผู้ให้บริการ",
  Government: "หน่วยงานกำกับดูแล / หน่วยงานราชการ"
};

const EXPECTATION_TEXT = {
  Energy: "การใช้พลังงานอย่างมีประสิทธิภาพ",
  GHG: "การปล่อยก๊าซเรือนกระจกและการเปลี่ยนแปลงสภาพภูมิอากาศ",
  Waste: "การลดของเสีย การใช้ซ้ำ และการรีไซเคิล",
  Chemical: "การจัดการสารเคมี วัตถุอันตราย และความปลอดภัย",
  Water: "การอนุรักษ์น้ำและการใช้น้ำอย่างมีประสิทธิภาพ",
  Procurement: "การจัดซื้อจัดจ้างอย่างยั่งยืน",
  Air: "คุณภาพอากาศ เสียง กลิ่น ฝุ่น และสภาพแวดล้อม",
  Biodiversity: "การคุ้มครองความหลากหลายทางชีวภาพ",
  Natural: "ความพร้อมของทรัพยากรธรรมชาติ",
  Pollution: "ความเสี่ยงจากมลพิษสะสมหรือระดับมลพิษ",
  Control: "การควบคุมและการสื่อสารผลการดำเนินงาน"
};

const REQUIREMENT_TEXT = {
  ISO14001: "ต้องการให้คงไว้ซึ่งการรับรอง ISO 14001",
  EnergyPolicy: "มีแนวทางใช้พลังงานอย่างมีประสิทธิภาพและเปลี่ยนผ่านสู่พลังงานหมุนเวียน",
  CarbonReduction: "มีผลรายงานการปล่อยก๊าซเรือนกระจกและเป้าหมายลดการปล่อย",
  WasteReduction: "มีเป้าหมายการลดของเสีย การใช้ซ้ำ และการรีไซเคิล",
  ChemicalControl: "มีแนวทางการจัดการสารเคมีและวัตถุอันตราย",
  WaterManagement: "มีแนวทางการอนุรักษ์น้ำและการใช้น้ำอย่างมีประสิทธิภาพ",
  PollutionControl: "มีแนวทางการควบคุมมลพิษทางอากาศ น้ำ เสียง และของเสีย",
  BiodiversityProtection: "มีการสื่อสารและให้การคุ้มครองความหลากหลายทางชีวภาพ"
};

const CLIMATE_ACTION_TEXT = {
  GHGReporting: "ประเมินและรายงานก๊าซเรือนกระจก",
  ISO14001GreenIndustry: "ได้รับมาตรฐาน ISO 14001 และการรับรองอุตสาหกรรมสีเขียวระดับ 3",
  CleanEnergy: "มีการใช้พลังงานทดแทน / พลังงานสะอาด",
  CarbonNeutralNetZero: "กำหนดเป้าหมาย Carbon Neutrality หรือ Net Zero",
  GreenProcurement: "Green Procurement (การจัดซื้อจัดจ้างสีเขียว)"
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse(false, "ไม่พบข้อมูลที่ส่งมา");
    }

    const rawBody = String(e.postData.contents);
    if (rawBody.length > MAX_BODY_LENGTH) {
      return createResponse(false, "ข้อมูลมีขนาดใหญ่เกินไป");
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (_) {
      return createResponse(false, "รูปแบบข้อมูลไม่ถูกต้อง");
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return createResponse(false, "ข้อมูลไม่ถูกต้อง");
    }

    if (String(data.website || "").trim() !== "") {
      return createResponse(false, "คำขอไม่ถูกต้อง");
    }

    const organization = cleanText(data.organization, MAX_ORGANIZATION_LENGTH);
    const contactName = cleanText(data.contactName, MAX_CONTACT_NAME_LENGTH);
    const surveyDate = cleanText(data.surveyDate, 20);
    const stakeholderType = cleanText(data.stakeholderType, 50);
    const otherStakeholder = cleanText(data.otherStakeholder, MAX_OTHER_STAKEHOLDER_LENGTH);
    const climateActionsOther = cleanText(data.climateActionsOther, MAX_OTHER_CLIMATE_ACTION_LENGTH);
    const expectations = validateList(data.expectations, ALLOWED_EXPECTATIONS, "ข้อมูลความคาดหวังไม่ถูกต้อง");
    const requirements = validateList(data.requirements, ALLOWED_REQUIREMENTS, "ข้อมูลความต้องการไม่ถูกต้อง");
    const climateActions = validateList(data.climateActions, ALLOWED_CLIMATE_ACTIONS, "ข้อมูลการดำเนินงานด้านสภาพภูมิอากาศไม่ถูกต้อง");
    const suggestion = cleanText(data.suggestion, MAX_SUGGESTION_LENGTH);

    if (!organization) {
      return createResponse(false, "กรุณาระบุชื่อองค์กรหรือหน่วยงาน");
    }
    if (!ALLOWED_STAKEHOLDER_TYPES.includes(stakeholderType)) {
      return createResponse(false, "ประเภทผู้มีส่วนได้ส่วนเสียไม่ถูกต้อง");
    }
    if (stakeholderType === "Other" && !otherStakeholder) {
      return createResponse(false, "กรุณาระบุประเภทผู้มีส่วนได้ส่วนเสีย");
    }
    if (climateActions.includes("Other") && !climateActionsOther) {
      return createResponse(false, "กรุณาระบุรายละเอียดการดำเนินงานด้านสภาพภูมิอากาศในหัวข้ออื่น ๆ");
    }
    if (surveyDate && !isValidDate(surveyDate)) {
      return createResponse(false, "รูปแบบวันที่ไม่ถูกต้อง");
    }

    const submissionId = cleanText(data.submissionId, 100);
    const cache = CacheService.getScriptCache();
    if (submissionId) {
      const key = `submission:${submissionId}`;
      if (cache.get(key)) return createResponse(false, "ข้อมูลนี้ถูกส่งไปแล้ว");
      cache.put(key, "1", 600);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`ไม่พบ Sheet ชื่อ ${SHEET_NAME}`);

    const stakeholderText = stakeholderType === "Other"
      ? otherStakeholder
      : (STAKEHOLDER_TEXT[stakeholderType] || stakeholderType);

    const expectationsText = expectations
      .map(code => EXPECTATION_TEXT[code] || code)
      .join(" | ");

    const requirementsText = requirements
      .map(code => REQUIREMENT_TEXT[code] || code)
      .join(" | ");

    const climateTextParts = climateActions
      .filter(code => code !== "Other")
      .map(code => CLIMATE_ACTION_TEXT[code] || code);

    if (climateActionsOther) {
      climateTextParts.push(climateActionsOther);
    }

    const climateText = climateTextParts.join(" | ");

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow([
        new Date(),
        safeCellText(organization),
        safeCellText(contactName),
        safeCellText(surveyDate),
        safeCellText(stakeholderText),
        safeCellText(otherStakeholder),
        safeCellText(expectationsText),
        safeCellText(requirementsText),
        safeCellText(climateText),
        safeCellText(suggestion)
      ]);
    } finally {
      lock.releaseLock();
    }

    return createResponse(true, "บันทึกข้อมูลเรียบร้อยแล้ว");
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return createResponse(false, "ระบบไม่สามารถบันทึกข้อมูลได้ในขณะนี้");
  }
}

function cleanText(value, maxLength) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function getListValues(value) {
  if (value === null || value === undefined || String(value).trim() === "") return [];
  return String(value).split(";").map(item => item.trim()).filter(Boolean);
}

function validateList(value, allowed, message) {
  const list = getListValues(value);
  if (list.some(item => !allowed.includes(item))) throw new Error(message);
  return [...new Set(list)];
}

function safeCellText(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function createResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: Boolean(success),
      message: String(message || "")
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
