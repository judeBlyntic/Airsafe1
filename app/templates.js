/* AirSafe report template definitions.
   Section titles are FIXED (non-editable); every field/text block is user-editable.
   Block types: sub | field | fieldpair | text | table.  A section with photos:true renders the photo manager. */

"use strict";

const COMMON_COVER = (withArcp, withWorkOrder) => {
  const f = [
    { key: "siteAddress", label: "Site Address", type: "text" },
    { key: "assessor", label: "Assessor", type: "text", def: "Ahmad Shendi" },
    { key: "dateOfIssue", label: "Date of Issue", type: "date" },
    { key: "reportNo", label: "Report Number", type: "text", def: "AS-XXXX.XXX-R0X—V0.1-CLR" }
  ];
  if (withWorkOrder) f.push({ key: "workOrder", label: "Work Order Number", type: "text" });
  if (withArcp) f.push({ key: "arcpReviewed", label: "ARCP and WorkSafe Notification Reviewed", type: "yesno", def: "Yes" });
  return f;
};

const SIGNATURE_BLOCKS = [
  { type: "sub", text: "Clearance Certificate Issued by and Assessors License Number" },
  { type: "sigtext", key: "issuedBy", rows: 3, def: "Ahmad Shendi\nLicensed Assessor - AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" },
  { type: "sub", text: "Clearance Inspection Undertaken by and Assessors License Number" },
  { type: "sigtext", key: "undertakenBy", rows: 3, def: "Ahmad Shendi\nLicensed Assessor - AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" }
];

const CLIENT_INFO_BLOCKS = [
  { type: "field", key: "companyName", label: "2.1 Company Name/Individual’s" },
  { type: "field", key: "companyAddress", label: "2.2 Company Address/Individual’s" },
  { type: "field", key: "contactPerson", label: "2.3 Contact Person" },
  { type: "field", key: "clientPhone", label: "2.4 Phone" },
  { type: "field", key: "clientEmail", label: "2.5 Email" }
];

/* =========================================================================
   ACC 2026 — CLASS A
   ========================================================================= */
const TPL_CLASS_A = {
  id: "classA",
  tileName: "Clearance Certificate — Class A",
  shortName: "Class A Clearance Certificate",
  subtitle: "ACC 2026 — Class A",
  docTitle: "ASBESTOS CLEARANCE CERTIFICATE CLASS A",
  fileLabel: "Asbestos_Clearance_Certificate_ClassA",
  accent: "#1b1b6f",
  cover: { fields: COMMON_COVER(false, true), reportFields: ["dateOfIssue", "workOrder"] },
  sections: [
    {
      id: "s1", title: "1. CERTIFICATE SUMMARY",
      blocks: [
        { type: "field", key: "arcpReviewed", label: "1.0 ARCP and WorkSafe Notification Reviewed", fieldType: "checkbox", def: "Yes" },
        { type: "field", key: "smokeTest", label: "1.1 Smoke Test Inspection completed successfully", fieldType: "checkbox", def: "Yes" },
        { type: "sub", text: "1.2 Summary" },
        { type: "text", key: "summary", rows: 10, def:
`[FULL COMPLETION – USE IF APPLICABLE]
This Clearance Certificate certifies that, in the opinion of Ahmad Shendi (Licence No. AA17040065) of AirSafe Ltd, the following location is fit for re-occupation.

Furthermore, Ahmad Shendi of AirSafe Ltd is of the opinion that as far as can be determined from the clearance inspection, the asbestos removal area does not pose a risk to health and safety from exposure to asbestos. ARCP and WorkSafe Notification were reviewed prior to commencement of works.

[STAGED WORKS – USE IF APPLICABLE]
This Clearance Certificate certifies that, in the opinion of Ahmad Shendi of AirSafe Ltd, the below mentioned location (See Section 3.5) for Stage X of X asbestos removal is fit for the remainder of the removal works to continue.

Furthermore, Ahmad Shendi of AirSafe Ltd is of the opinion that as far as can be determined from the clearance inspection, the asbestos removal area for Stage X of X does not pose a risk to health and safety.

Please note; it is vitally important to note that this certificate is specifically for the (stage X of X) of the scheduled asbestos removal works. OR [it is vitally important to note that this certificate is specifically for the scope of works (NAME AREA AND ITEMS) removal mentioned within ARCP and WorkSafe Notification.]

No demolition or refurbishment can take place prior to the successful completion of the entire asbestos removal. The property must first be fully decontaminated from all the asbestos mentioned within the building materials asbestos survey, ARCP, and the WorkSafe notifications. Please see (Section 4.3) which mentions the Asbestos Contaminated Materials (ACM) remaining that must be removed as part of stage X prior to commencement of any demolition and/ or refurbishment works.

[IF IN-SITU ITEMS PRESENT]
Strongly suspected asbestos [state type XXXXXXXX] directly [state location] the removal area was not considered a part of the scope of works and therefore will remain in-situ as mentioned in Section 4.3 of this report.

All of AirSafe’s document(s) and/or information, including Clearance Inspection Certificates and reports, cannot be reproduced or reviewed except in full. All documents and reports are prepared for the client’s objectives and scope of works, and thus should not be used by any third party as a basis for future decision-making.` }
      ]
    },
    { id: "s2", title: "2.0 CLIENT INFORMATION", blocks: CLIENT_INFO_BLOCKS },
    {
      id: "s3", title: "3.0 REMOVAL INFORMATION",
      blocks: [
        { type: "sub", text: "3.1 Date and Time of Inspection" },
        { type: "fieldpair", keys: ["inspDate", "inspTime"], labels: ["Date", "Time"], types: ["date", "time"] },
        { type: "field", key: "siteAddress3", label: "3.2 Site Address" },
        { type: "field", key: "supervisor", label: "3.3 Licensed Asbestos Removal Company Supervisor Name and Permit Number" },
        { type: "field", key: "removalCompany", label: "3.4 Licensed Asbestos Removal Company Name and Permit Number" },
        { type: "sub", text: "3.5 Asbestos Removal Location" },
        { type: "text", key: "removalLocation", rows: 2, def: "" },
        { type: "sub", text: "3.6 Scope of Works" },
        { type: "text", key: "scopeOfWorks", rows: 5, def:
`The list of removed non-friable Asbestos Containing Materials (ACMs):
• xxxx
• xxxx
• xxxx` },
        { type: "sub", text: "3.7 Specific Areas Inspected" },
        { type: "text", key: "areasInspected", rows: 6, def:
`The inspection of specified Asbestos removal work areas (post removal of ACMs):
• xxxx
• xxxx
• xxxx

Refer to the site layout and enclosure diagram (Appendix C) for the defined work areas and inspection boundaries.` }
      ]
    },
    {
      id: "s4", title: "4.0 VISUAL CLEARANCE INSPECTION",
      blocks: [
        { type: "sub", text: "4.1 Inspection Details" },
        { type: "text", key: "inspectionDetails", rows: 8, def:
`Upon completion of all asbestos removal activities (see Section 3.6 of this Clearance Certificate for details), a visual clearance inspection was carried out by AirSafe.

All works were undertaken in accordance with the Health and Safety at Work (Asbestos) Regulations 2016, and the Approved Code of Practice for the Management and Removal of Asbestos (Nov 2016), and the Good Practice Guidelines for Conducting Asbestos Air Monitoring and Clearance Inspections (April 2026).

The Asbestos Removal Control Plan (ARCP), WorkSafe Notification, and associated site layout/enclosure diagram provided by the removalist were reviewed prior to and during the clearance inspection to confirm the scope of works, removal methodology, and defined work areas. The diagram outlines the removal area, enclosure/work area, and relevant site features (including airlocks, baglocks, transit and waste routes, and DCU/skip locations where applicable). Refer to Appendix C, which the assessor confirms is representative of the removal works undertaken.` },
        { type: "sub", text: "4.2 Overview" },
        { type: "text", key: "overview", rows: 9, def:
`It is the opinion of the AirSafe assessor that the ACMs as mentioned in the Clearance Certificate (Section 3.6) have been removed “as far as reasonably practicable” to an acceptable industry standard. As far as can be determined from the clearance inspection, the asbestos removal area does not pose a risk to health and safety from exposure to asbestos.

The inspection included all accessible areas within the enclosure, as well as the immediate surrounding areas, transit routes, and waste pathways associated with the removal works.

The defined area/s in which the enclosure was erected (see Section 3.6) and the areas immediately surrounding the enclosure were inspected and no visible asbestos debris was found.

[IF REMOVAL WORKS IS A STAGE OF FEW STAGES – REMOVE IF NOT REQUIRED]
Please Note: It is vitally important to note that this certificate is specifically for stage (X of X) of the scheduled asbestos removal works. No demolition or refurbishment can take place prior to the successful completion of the entire asbestos removal. The property must first be fully decontaminated from all the asbestos mentioned within the building materials asbestos survey, ARCP, and the WorkSafe notifications. Please see Section 4.3 which identifies the Asbestos Contaminated Materials (ACM) remaining that must be removed as part of stage 2 prior to commencement of any demolition and/or refurbishment works.

See Appendix A for photographs taken prior to and following the removal of ACMs.` },
        { type: "table", key: "t421", title: "4.2.1 Stage 1 – Scope Confirmation",
          caption: "The following checks represent the completion of Stage 1 (scope confirmation) clearance requirements for non-friable asbestos removal works.",
          items: [
          "WorkSafe Notification Reviewed", "ARCP Reviewed", "Scope of Removal Matches ARCP", "Site Setup Matches ARCP" ] },
        { type: "table", key: "t422", title: "4.2.2 Stage 2 – Visual Inspection",
          caption: "The following checks represent the completion of Stage 2 (visual inspection) clearance requirements for non-friable asbestos removal works.",
          items: [
          "ACMs Removed", "No Visible Asbestos Debris", "Work Area Clean", "Transit and Waste Routes Clean" ] },
        { type: "table", key: "t423", title: "4.2.3 Stage 3 – Surface Testing by Dust Disturbance", itemHeader: "Condition", items: [
          "Area Dry", "NPUs Switched Off and Capped", "Dust Disturbance Conducted" ] },
        { type: "text", key: "stage3Note", rows: 3, def:
`Surface testing by dust disturbance was undertaken to simulate worst-case disturbance conditions prior to clearance airborne fibre monitoring.

No surface swab sampling was undertaken, in accordance with the WorkSafe New Zealand Good Practice Guidelines for Conducting Asbestos Air Monitoring and Clearance Inspections (April 2026).` },
        { type: "table", key: "t424", title: "4.2.4 Stage 4 – Final Assessment Following Enclosure Removal", items: [
          "Enclosure Removed", "Surrounding Areas Clean", "No Visible Asbestos Debris or Residual Contamination" ] },
        { type: "sub", text: "4.3 ACMs Remaining", toggle: "acmsRemaining" },
        { type: "text", key: "acmsRemaining", rows: 10, def:
`The following (assumed) ACMs were not included within the scope of works for this project. Therefore, it was not/they have not been removed and are to remain In-situ:
• XXXX
• XXXX

It is the recommendation of Ahmad Shendi of AirSafe that the suspected ACMs mentioned above are integrated into a site Asbestos Register and the associated Asbestos Management Plan (AMP).

OR

The following (assumed) ACMs were not included within (Stage X) scope of works for this project. Therefore, it was not removed and are to remain In-situ until its removal in Stage X of the project:
• Asbestos non-friable material mentioned within the planned stage X (Class B OR A removal) scope of works of project to be removed prior to the commencement of any demolition or refurbishment works.

The above-mentioned items will be removed as part of the stage X removal works commencing in the near future. A second clearance inspection must be carried out and a certificate must be issued prior to commencement of any future planned demolition or renovation works.

OR [IF DWELLING]
It is the recommendation of Ahmad Shendi of AirSafe that the suspected ACMs mentioned above are noted and its condition monitored and maintained. [Provide recommendation if in bad condition]. Any future works to the area which is likely to disturb the asbestos must firstly get the asbestos removed by specialised asbestos removal contractors prior to commencing works.

Please see (Appendix A) for photos of the in-situ material.` }
      ]
    },
    {
      id: "s5", title: "5.0 ASBESTOS AIRBORNE FIBRE MONITORING",
      blocks: [
        { type: "sub", text: "5.1 Work in Progress Monitoring" },
        { type: "text", key: "wipMonitoring", rows: 7, def:
`Work-in-progress airborne fibre monitoring was undertaken during the asbestos removal works on the following date(s): [INSERT DATE(S)].

The purpose of work-in-progress monitoring is to assess airborne fibre concentrations during removal activities and confirm the effectiveness of control measures in place.

IANZ accredited work-in-progress airborne fibre monitoring was carried out using the membrane filter method in accordance with AirSafe’s in-house technical procedures during the removal of the ACMs listed within Section 3.6 of this Clearance Certificate.

The fibre counting analysis of all airborne samples was completed by PROLABS at their IANZ accredited laboratory. Refer to Appendix B for details. Results are provided in Section 5.3.` },
        { type: "sub", text: "5.2 Clearance Monitoring" },
        { type: "text", key: "clearanceMonitoring", rows: 7, def:
`Clearance airborne fibre monitoring was undertaken on [INSERT DATE] following completion of surface testing by dust disturbance (see Section 4.2.3).

IANZ accredited clearance airborne fibre monitoring was carried out using the membrane filter method in accordance with AirSafe’s in-house technical procedures, following the completion of a visual inspection confirming that all ACMs included within the scope of works (Section 3.6) had been removed “as far as reasonably practicable” to a satisfactory level and to an acceptable industry standard.

The fibre counting analysis of all airborne samples was completed by PROLABS at their IANZ accredited laboratory. Refer to Appendix B for details. Results are provided in Section 5.3.

Airborne fibre monitoring was undertaken in accordance with recognised methods and guidance, including appropriate sampling techniques to meet clearance requirements.` },
        { type: "sub", text: "5.3 Asbestos Airborne Fibre Monitoring Results" },
        { type: "text", key: "monitoringResults", rows: 4, def:
`The fibre counting analysis of all asbestos airborne fibre monitoring was completed by PROLABS at their IANZ accredited laboratory. See Appendix B for details.

The laboratory analysis results of the airborne asbestos fibre monitoring reported less than the minimum detection limit of the method, which is <0.01 f/mL (refer to PROLAB Airborne Asbestos Monitoring Report xxxxx). See Appendix B for details.` }
      ]
    },
    {
      id: "s6", title: "6.0 NOTES AND LIMITATIONS",
      blocks: [
        { type: "text", key: "notesLimitations", rows: 16, def:
`All inspections are conducted in a professional manner, with due diligence and proper care. However, due to the incommensurate costs of potential damages or liability in relation to the cost of our consultancy services, AirSafe is unable to guarantee that all related ACMs and its associated hazard issues have been identified and/or addressed.

This Clearance Certificate and any visual inspection mentioned are specifically limited to both visible and accessible above ground surfaces only.

This Visual Clearance Inspection and Certificate is only for visible Asbestos containing materials within the areas inspected (see Section 3.6).

Unless specified, this Clearance Certificate does not represent a thorough site survey for Asbestos and therefore does not guarantee that any debris and/or dust present in and around the inspected former Asbestos work locations (see Section 3.6 and Section 3.7) are free of Asbestos.

Due to the nature of this inspection, it is likely that Asbestos containing/suspected materials could potentially be discovered below the ground surface and/or located in areas which were inaccessible or visually obscured during the inspection. AirSafe recommends the client or any other third party to consult professional advice from a qualified asbestos assessor if any suspected asbestos containing materials are discovered. Access to the area(s) should be restricted until professional advice has been sought from a qualified assessor such as AirSafe.

The nature of any structural framing surfaces such as rough-sawn/coarse timber framing or surfaces such as irregular, porous concrete, fibrous underlay to structural framing, or any other materials with similar characteristics mentioned in (see Section 3.7) has the potential to hold on to Asbestos Containing Dust (ACD). Therefore, while considering that such surfaces have been sprayed with PVA solution and HEPA vacuumed, AirSafe cannot guarantee that all ACD has been eliminated/cleared from the above-mentioned surfaces (see Section 3.7) and thus, does not constitute a part of this Clearance Certificate.

While conducting the Visual Inspection, the client did not request any Dust/Soil/ground samples to be collected from the former ACMs inspection areas mentioned in (Section 3.6). It was also viewed by AirSafe, as not being an essential component for the completion of the Clearance Inspection. As a result, the collection and analysis of validation Dust/Soil/ground samples was not undertaken and therefore, it does not constitute a part of this Clearance Certificate. [DELETE IF NOT APPLICABLE OR ELABORATE ON SITUATION]

The Visual Inspection describes the observed conditions within the areas inspected upon the completion of remediation works. The inspection is dependent upon site conditions at the time. There is a possibility that site conditions may change as a result of further site works or activities, or natural unforeseen events in the future, and therefore this Clearance Certificate must not be considered accurate beyond the time of inspection.

AirSafe accepts no responsibility or liability for the work carried out by the Licensed Asbestos Removal Contractor and the completeness of the Asbestos removal works. It is the obligation of the appointed licensed Asbestos removal contractor to ensure the safety of their work and that it is completed competently by skilled and qualified staff. Furthermore, it is also their responsibility to abide by any laws, by-laws, methods and standards to the relevant legislation and codes of practice and that they seek all necessary approvals prior to commencing work.

This Clearance Certificate is limited to visible and accessible above ground surfaces only. The ground surface areas immediately below the removal area was surrounded by dense vegetation and long grass and were not visible or accessible at the time of the visual inspection. These areas were visually obscured and therefore not included in this Clearance Certificate. [DELETE IF NOT APPLICABLE OR ELABORATE ON SITUATION]

This Clearance Certificate is limited to visible and accessible areas only. As areas beneath the croft adjacent to the work area were not accessible, there were excluded from this Clearance Certificate. [DELETE IF NOT APPLICABLE OR ELABORATE ON SITUATION]

This document should not be utilized or relied upon for any purpose, unless the individual or party acknowledges on behalf of themselves and all other legal bodies they represent, the explicit acceptance and approval of the exclusions and limitations mentioned within this document.` }
      ]
    },
    {
      id: "s7", title: "7.0 RE-OCCUPATION",
      blocks: [
        { type: "text", key: "reoccupation", rows: 12, def:
`AirSafe is of the opinion that the asbestos to the scope of works specified removal work area(s)/location(s) mentioned within Section 3.6 have been removed “as far as reasonably practicable” to an acceptable industry standard. Furthermore, AirSafe is of the opinion that as far as can be determined from the clearance inspection, the asbestos removal area does not pose a risk to health and safety from exposure to asbestos.

Accordingly, AirSafe is of the opinion that the area(s)/location(s) is suitable to re-occupy and for normal works to commence (Please refer to the limitations in Section 6.0 and ACM(s) remaining in-situ Section 4.3).

[IF REMOVAL IS A STAGE OF A FEW STAGES – REMOVE IF NOT REQUIRED]
Please note: It is vitally important to note that this certificate is specifically for the (stage X of X) of the scheduled asbestos removal works. No demolition or refurbishment can take place prior to the successful completion of the entire asbestos removal. The property must first be fully decontaminated from all the asbestos mentioned within the building materials asbestos survey, ARCP, and the WorkSafe notifications. Please see (Section 4.3) which mentions the Asbestos Contaminated Materials (ACM) remaining that must be removed as part of stage 2 prior to commencement of any demolition and/ or refurbishment works.

“As far as reasonably practicable”, the defined area/s in which the enclosure was erected (see Section 3.6) and the area immediately surrounding the area where the enclosure was erected was inspected and no visible asbestos debris was found.

“As far as reasonably practicable”, the visible and accessible waste and transit routes have been inspected and no visible asbestos debris was found.

All of AirSafe’s document(s) and/or information, including Clearance Inspection Certificates and reports, cannot be reproduced or reviewed except in full. All documents and reports are prepared for the client’s objectives and scope of works, and thus should not be used by any third party as a basis for future decision-making.

While AirSafe carries out the work to the best of our ability, AirSafe shall have no liability to the Client and/or other associated third parties whatsoever for any loss, damage or expenses arising out of the performance or non-performance of the service.` },
        { type: "sub", text: "Clearance Certificate Issued by and Assessors License Number" },
        { type: "sigtext", key: "issuedBy", rows: 3, def: "Ahmad Shendi\nLicensed Assessor - AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" },
        { type: "sub", text: "Clearance Inspection Undertaken by and Assessors License Number" },
        { type: "sigtext", key: "undertakenBy", rows: 3, def: "Ahmad Shendi\nLicensed Assessor - AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" }
      ]
    },
    { id: "appA", title: "APPENDIX A — Photographs", photos: true, blocks: [] },
    { id: "appB", title: "APPENDIX B — Photographs", photos: true, attachments: true, blocks: [] },
    { id: "appC", title: "APPENDIX C — Photographs", photos: true, attachments: true, blocks: [] }
  ]
};

/* =========================================================================
   ACC 2026 — CLASS B
   ========================================================================= */
const TPL_CLASS_B = {
  id: "classB",
  tileName: "Clearance Certificate — Class B",
  shortName: "Class B Clearance Certificate",
  subtitle: "ACC 2026 — Class B",
  docTitle: "ASBESTOS CLEARANCE CERTIFICATE CLASS B",
  fileLabel: "Asbestos_Clearance_Certificate_ClassB",
  accent: "#2563ab",
  cover: { fields: COMMON_COVER(true, true), reportFields: ["dateOfIssue", "workOrder", "arcpReviewed"] },
  sections: [
    {
      id: "s1", title: "1.0 CERTIFICATE SUMMARY",
      blocks: [
        { type: "sub", text: "1.1 Summary" },
        { type: "text", key: "summary", rows: 12, def:
`(IF NO ADDITIONAL COMMENTS NEEDED)
This Clearance Certificate certifies that, in the opinion of Ahmad Shendi (Licence No. AA17040065) of AirSafe Ltd, the following location is fit for re-occupation. Furthermore, Ahmad Shendi of AirSafe Ltd is of the opinion that as far as can be determined from the clearance inspection, the asbestos removal area does not pose a risk to health and safety from exposure to asbestos. ARCP and WorkSafe Notification were reviewed prior to commencement of works.

[IF REMOVAL WORKS IN A STAGE OF FEW STAGES FOR REMOVAL]
This Clearance Certificate certifies that, in the opinion of Ahmad Shendi (Licence No. AA17040065) of AirSafe Ltd, the below mentioned location (See Section 3.5) for the stage (X of X) asbestos removal is fit for the remainder of the removal works to continue.

Furthermore, Ahmad Shendi of AirSafe Ltd is of the opinion that as far as can be determined from the clearance inspection, the asbestos removal area for the stage (X of X) of the scope of works does not pose a risk to health and safety from exposure to asbestos. ARCP and WorkSafe Notification were reviewed prior to commencement of works.

Please note; it is vitally important to note that this certificate is specifically for the (stage X of X) of the scheduled asbestos removal works. OR [it is vitally important to note that this certificate is specifically for the scope of works (NAME AREA AND ITEMS) removal mentioned within ARCP and WorkSafe Notification.]

No demolition or refurbishment can take place prior to the successful completion of the entire asbestos removal. The property must first be fully decontaminated from all the asbestos mentioned within the building materials asbestos survey, ARCP, and the WorkSafe notifications. Please see (Section 4.3) which mentions the Asbestos Contaminated Materials (ACM) remaining that must be removed as part of stage X prior to commencement of any demolition and/ or refurbishment works.

[IF IN-SITU ITEMS PRESENT]
Strongly suspected asbestos [state type of asbestos XXXXXXXX] directly [state location] the removal area was not considered a part of the scope of works and therefore will remain in-situ as mentioned in Section 4.3 of this report.

Please note; all of AirSafe’s document(s) and/or information, including Clearance Inspection Certificates and reports, cannot be reproduced or reviewed except in full. All documents and reports are prepared for the client’s objectives and scope of works, and thus should not be used by any third party as a basis for future decision-making.` }
      ]
    },
    { id: "s2", title: "2.0 CLIENT INFORMATION", blocks: CLIENT_INFO_BLOCKS },
    {
      id: "s3", title: "3.0 REMOVAL INFORMATION",
      blocks: [
        { type: "sub", text: "3.1 Date and Time of Inspection" },
        { type: "fieldpair", keys: ["inspDate", "inspTime"], labels: ["Date", "Time"], types: ["date", "time"] },
        { type: "field", key: "siteAddress3", label: "3.2 Site Address" },
        { type: "field", key: "supervisor", label: "3.3 Licensed Asbestos Removal Company Supervisor Name and Permit Number" },
        { type: "field", key: "removalCompany", label: "3.4 Licensed Asbestos Removal Company Name and Permit Number" },
        { type: "sub", text: "3.5 Asbestos Removal Location" },
        { type: "text", key: "removalLocation", rows: 2, def: "" },
        { type: "sub", text: "3.6 Scope of Works" },
        { type: "text", key: "scopeOfWorks", rows: 5, def:
`The list of removed non-friable Asbestos Containing Materials (ACMs):
• xxxx
• xxxx
• xxxx` },
        { type: "sub", text: "3.7 Specific Areas Inspected" },
        { type: "text", key: "areasInspected", rows: 6, def:
`The inspection of specified Asbestos removal work areas (post removal of ACMs):
• xxxx
• xxxx
• xxxx

Refer to Appendix D for site layout/enclosure diagram.` }
      ]
    },
    {
      id: "s4", title: "4.0 VISUAL CLEARANCE INSPECTION",
      blocks: [
        { type: "sub", text: "4.1 Inspection Details" },
        { type: "text", key: "inspectionDetails", rows: 6, def:
`Upon completion of all asbestos removal activities (see Section 3.6 of this Clearance Certificate for details), a visual clearance inspection was carried out by AirSafe. All works were undertaken in accordance with the Health and Safety at Work (Asbestos) Regulations 2016, and the Approved Code of Practice for the Management and Removal of Asbestos (Nov 2016), and current WorkSafe New Zealand guidance.

The Asbestos Removal Control Plan (ARCP), WorkSafe Notification, and associated site layout diagram were reviewed prior to and during the clearance inspection to confirm the scope of works and defined work areas, in accordance with current WorkSafe New Zealand guidance.` },
        { type: "sub", text: "4.2 Overview" },
        { type: "text", key: "overview", rows: 8, def:
`It is the opinion of the AirSafe assessor that the ACMs as mentioned in the Clearance Certificate (Section 3.6) have been removed “as far as reasonably practicable” to an acceptable industry standard. As far as can be determined from the clearance inspection, the asbestos removal area does not pose a risk to health and safety from exposure to asbestos.

“As far as reasonably practicable”, the defined area/s of prior ACMs (see Section 3.6) have been visually inspected (including within one metre of visible and accessible surrounding area) and are considered to be free of visible residual/remnant ACM debris.

[IF REMOVAL WORKS IS A STAGE OF FEW STAGES – REMOVE IF NOT REQUIRED]
Please Note: It is vitally important to note that this certificate is specifically for the stage (X of X) of the scheduled asbestos removal works. No demolition or refurbishment can take place prior to the successful completion of the entire asbestos removal. The property must first be fully decontaminated from all the asbestos mentioned within the building materials asbestos survey, ARCP, and the WorkSafe notifications. Please see (Section 4.3) which mentions the Asbestos Contaminated Materials (ACM) remaining that must be removed as part of stage 2 prior to commencement of any demolition and/ or refurbishment works.

[ADDITIONAL NOTES IF REQUIRED]
See Appendix A for attached Photographs prior and following the removal of ACMs.` },
        { type: "table", key: "t421", title: "4.2.1 Stage 1 – Scope Confirmation", itemHeader: "Site Details", items: [
          "WorkSafe Notification Viewed", "ARCP Viewed", "ARCP Site Layout Diagram Accurate",
          "ARCP Scope Matches Works Undertaken", "Removal Area Clearly Defined", "Waste/Transit Routes Identified" ] },
        { type: "field", key: "s1Status", label: "Stage 1 Status", fieldType: "select", options: ["Completed", "Not Completed"], def: "Completed" },
        { type: "field", key: "s1Assessor", label: "Stage 1 Assessor" },
        { type: "fieldpair", keys: ["s1Date", "s1Time"], labels: ["Stage 1 Date", "Stage 1 Time"], types: ["date", "time"] },
        { type: "table", key: "t422", title: "4.2.2 Stage 2 – Visual Inspection", itemHeader: "Inspection Details", items: [
          "All ACMs Removed (Section 3.6)", "No Visible Asbestos Debris", "Work Area Clean",
          "Surrounding Areas Clean", "Waste/Transit Routes Clean" ] },
        { type: "text", key: "stage2Note", rows: 2, def:
`A thorough visual inspection of all visible and accessible areas was undertaken to confirm that all ACMs have been removed and that no visible asbestos debris remains within the inspected areas.` },
        { type: "field", key: "s2Status", label: "Stage 2 Status", fieldType: "select", options: ["Completed", "Not Completed"], def: "Completed" },
        { type: "field", key: "s2Assessor", label: "Stage 2 Assessor" },
        { type: "fieldpair", keys: ["s2Date", "s2Time"], labels: ["Stage 2 Date", "Stage 2 Time"], types: ["date", "time"] },
        { type: "sub", text: "4.3 ACMs Remaining", toggle: "acmsRemaining" },
        { type: "text", key: "acmsRemaining", rows: 10, def:
`The following (assumed) ACMs were not included within the scope of works for this project. Therefore, it was not/they have not been removed and are to remain In-situ:
• XXXX
• XXXX

It is the recommendation of Ahmad Shendi of AirSafe that the suspected ACMs mentioned above are integrated into a site Asbestos Register and the associated Asbestos Management Plan (AMP).

OR

The following (assumed) ACMs were not included within (Stage X) scope of works for this project. Therefore, it was not removed and are to remain In-situ until its removal in Stage X of the project:
• Asbestos non-friable material mentioned within the planned stage X (Class B OR A removal) scope of works of project to be removed prior to the commencement of any demolition or refurbishment works.

The above-mentioned items will be removed as part of the stage X removal works commencing in the near future. A second clearance inspection must be carried out and a certificate must be issued prior to commencement of any future planned demolition or renovation works.

OR [IF DWELLING]
It is the recommendation of Ahmad Shendi of AirSafe that the suspected ACMs mentioned above are noted and its condition monitored and maintained. [Provide recommendation if in bad condition]. Any future works to the area which is likely to disturb the asbestos must firstly get the asbestos removed by specialised asbestos removal contractors prior to commencing works.

Please see (Appendix A) for photos of the in-situ material.` }
      ]
    },
    {
      id: "s5", title: "5.0 ASBESTOS AIRBORNE FIBRE MONITORING",
      blocks: [
        { type: "sub", text: "5.1 Work in Progress Monitoring" },
        { type: "text", key: "wipMonitoring", rows: 6, def:
`Work In Progress Airborne Fibre Monitoring was undertaken on DATE.

IANZ Accredited Work in Progress Airborne Fibre Monitoring was carried out using the membrane filter method and in accordance with AirSafe’s in-house technical procedures during the removal of the ACMs listed within (Section 3.6) of this Clearance Certificate.

OR

The Client has not given approval for Clearance Airborne Fibre Monitoring to be carried out during the removal of ACMs listed within (Section 3.6). It was also viewed by AirSafe, as not being an essential component for the completion of the Clearance Inspection, and therefore, it does not constitute a part of this Clearance Certificate.` },
        { type: "sub", text: "5.2 Clearance Monitoring" },
        { type: "text", key: "clearanceMonitoring", rows: 6, def:
`Clearance Airborne Fibre Monitoring was undertaken on DATE.

IANZ Accredited Clearance Airborne Fibre Monitoring was conducted using the membrane filter method and in accordance with AirSafe’s in-house technical procedures after a visual inspection of all ACMs included within the scope of works (Section 3.6) has been completed “as far as reasonably practicable” to a satisfactory level and to an acceptable industry standard.

OR

The Client has not given approval for Clearance Airborne Fibre Monitoring to be carried out during the removal of ACMs listed within (Section 3.6). It was also viewed by AirSafe, as not being an essential component for the completion of the Clearance Inspection, and therefore, it does not constitute a part of this Clearance Certificate.` },
        { type: "sub", text: "5.3 Asbestos Airborne Fibre Monitoring Results" },
        { type: "text", key: "monitoringResults", rows: 4, def:
`[DELETE SECTION IF NOT NEEDED]
The fibre counting analysis of all asbestos airborne fibre monitoring was completed by PROLABS at their IANZ accredited laboratory. See Appendix B for details.

The laboratory analysis results of the airborne asbestos fibre monitoring reported less than the minimum detection limit of the method, which is <0.01 f/mL (refer to PROLAB Airborne Asbestos Monitoring Report xxxxx). See Appendix B for details.` }
      ]
    },
    {
      id: "s6", title: "6.0 CLEARANCE GROUND SURFACE SOIL SAMPLING",
      blocks: [
        { type: "sub", text: "6.1 Ground/Soil Surface Sampling" },
        { type: "text", key: "soilSampling", rows: 5, def:
`[DELETE SECTION IF NOT NEEDED]
AirSafe collected (MENTION # OF SAMPLES) ground/soil surface samples from the below mentioned areas. The number and locations of the samples obtained was established by AirSafe in co-occurrence with the Client.

As per AirSafe’s in-house technical Procedures, the samples were collected from the following locations below:
• Xxx` },
        { type: "sub", text: "6.2 Ground/Soil Surface Sampling Results" },
        { type: "text", key: "soilResults", rows: 4, def:
`[DELETE SECTION IF NOT NEEDED]
The IANZ accredited laboratory PROLABS undertook all of the Ground/Soil Surface sample analysis sampled from the locations mentioned above (see Section 6.1).

The analysis of the Ground/Soil Surface sample attained a negative result for the presence of Asbestos (non-asbestos containing). Refer to (PROLAB Certificate of Analysis xxxxx). See Appendix C for details.` }
      ]
    },
    {
      id: "s7", title: "7.0 NOTES AND LIMITATIONS",
      blocks: [
        { type: "text", key: "notesLimitations", rows: 16, def:
`All inspections are conducted in a professional manner, with due diligence and proper care. However, due to the incommensurate costs of potential damages or liability in relation to the cost of our consultancy services, AirSafe is unable to guarantee that all related ACMs and its associated hazard issues have been identified and/or addressed.

This Clearance Certificate and any visual inspection mentioned are specifically limited to both visible and accessible above ground surfaces only.

This Visual Clearance Inspection and Certificate is only for visible Asbestos containing materials within the areas inspected (see Section 3.6).

Unless specified, this Clearance Certificate does not represent a thorough site survey for Asbestos and therefore does not guarantee that any debris and/or dust present in and around the inspected former Asbestos work locations (see Section 3.6 and Section 3.7) are free of Asbestos.

Due to the nature of this inspection, it is likely that Asbestos containing/suspected materials could potentially be discovered below the ground surface and/or located in areas which were inaccessible or visually obscured during the inspection. AirSafe recommends the client or any other third party to consult professional advice from a qualified asbestos assessor if any suspected asbestos containing materials are discovered. Access to the area(s) should be restricted until professional advice has been sought from a qualified assessor such as AirSafe.

The nature of any structural framing surfaces such as rough-sawn/coarse timber framing or surfaces such as irregular, porous concrete, fibrous underlay to structural framing, or any other materials with similar characteristics mentioned in (see Section 3.7) has the potential to hold on to Asbestos Containing Dust (ACD). Therefore, while considering that such surfaces have been sprayed with PVA solution and HEPA vacuumed, AirSafe cannot guarantee that all ACD has been eliminated/cleared from the above-mentioned surfaces (see Section 3.7) and thus, does not constitute a part of this Clearance Certificate.

While conducting the Visual Inspection, the client did not request any Soil/ground samples to be collected from the former ACMs inspection areas mentioned in (Section 3.6). It was also viewed by AirSafe, as not being an essential component for the completion of the Clearance Inspection. As a result, the collection and analysis of validation Soil/ground samples was not undertaken and therefore, it does not constitute a part of this Clearance Certificate. [DELETE IF NOT APPLICABLE OR ELABORATE ON SITUATION]

The Visual Inspection describes the observed conditions within the areas inspected upon the completion of remediation works. The inspection is dependent upon site conditions at the time. There is a possibility that site conditions may change as a result of further site works or activities, or natural unforeseen events in the future, and therefore this Clearance Certificate must not be considered accurate beyond the time of inspection.

AirSafe accepts no responsibility or liability for the work carried out by the Licensed Asbestos Removal Contractor and the completeness of the Asbestos removal works. It is the obligation of the appointed licensed Asbestos removal contractor to ensure the safety of their work and that it is completed competently by skilled and qualified staff. Furthermore, it is also their responsibility to abide by any laws, by-laws, methods and standards to the relevant legislation and codes of practice and that they seek all necessary approvals prior to commencing work.

This Clearance Certificate is limited to visible and accessible above ground surfaces only. The ground surface areas immediately below the removal area was surrounded by dense vegetation and long grass and were not visible or accessible at the time of the visual inspection. These areas were visually obscured and therefore not included in this Clearance Certificate. [DELETE IF NOT APPLICABLE OR ELABORATE ON SITUATION]

This Clearance Certificate is limited to visible and accessible areas only. As areas beneath the croft adjacent to the work area were not accessible, there were excluded from this Clearance Certificate. [DELETE IF NOT APPLICABLE OR ELABORATE ON SITUATION]

This document should not be utilized or relied upon for any purpose, unless the individual or party acknowledges on behalf of themselves and all other legal bodies they represent, the explicit acceptance and approval of the exclusions and limitations mentioned within this document.` }
      ]
    },
    {
      id: "s8", title: "8.0 RE-OCCUPATION",
      blocks: [
        { type: "text", key: "reoccupation", rows: 12, def:
`AirSafe is of the opinion that the asbestos to the scope of works specified removal work area(s)/location(s) mentioned within Section 3.6 have been removed “as far as reasonably practicable” to an acceptable industry standard. Furthermore, AirSafe is of the opinion that as far as can be determined from the clearance inspection, the asbestos removal area does not pose a risk to health and safety from exposure to asbestos.

Accordingly, AirSafe is of the opinion that the area(s)/location(s) is suitable to re-occupy and for normal works to commence (Please refer to the limitations in Section 7.0 and ACM(s) remaining in-situ Section 4.3).

[IF REMOVAL IS A STAGE OF A FEW STAGES – REMOVE IF NOT REQUIRED]
Please note: It is vitally important to note that this certificate is specifically for the (stage X of X) of the scheduled asbestos removal works. No demolition or refurbishment can take place prior to the successful completion of the entire asbestos removal. The property must first be fully decontaminated from all the asbestos mentioned within the building materials asbestos survey, ARCP, and the WorkSafe notifications. Please see (Section 4.3) which mentions the Asbestos Contaminated Materials (ACM) remaining that must be removed as part of stage 2 prior to commencement of any demolition and/ or refurbishment works.

“As far as reasonably practicable”, the defined area/s of former ACMs (see Section 3.6) have been visually inspected (including within one metre of accessible surrounding space) and are considered to be free of visible residual/remnant ACM debris.

“As far as reasonably practicable”, the visible and accessible waste and transit routes have been inspected and no visible asbestos debris was found.

All of AirSafe’s document(s) and/or information, including Clearance Inspection Certificates and reports, cannot be reproduced or reviewed except in full. All documents and reports are prepared for the client’s objectives and scope of works, and thus should not be used by any third party as a basis for future decision-making.

While AirSafe carries out the work to the best of our ability, AirSafe shall have no liability to the Client and/or other associated third parties whatsoever for any loss, damage or expenses arising out of the performance or non-performance of the service.` },
        { type: "sub", text: "Clearance Certificate Issued by and Assessors License Number" },
        { type: "sigtext", key: "issuedBy", rows: 3, def: "Ahmad Shendi\nLicensed Assessor - AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" },
        { type: "sub", text: "Clearance Inspection Undertaken by and Assessors License Number" },
        { type: "sigtext", key: "undertakenBy", rows: 3, def: "Ahmad Shendi\nLicensed Assessor - AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" }
      ]
    },
    { id: "appA", title: "APPENDIX A — Photographs", photos: true, blocks: [] },
    { id: "appB", title: "APPENDIX B — Photographs", photos: true, attachments: true, blocks: [] },
    { id: "appC", title: "APPENDIX C — Photographs", photos: true, attachments: true, blocks: [] }
  ]
};

/* =========================================================================
   FAILED CLEARANCE INSPECTION RECORD
   ========================================================================= */
const TPL_FAILED = {
  id: "failed",
  tileName: "Failed Clearance Inspection Record",
  shortName: "Failed Clearance Inspection Record",
  subtitle: "Failed Clearance Record",
  docTitle: "ASBESTOS FAILED CLEARANCE INSPECTION RECORD",
  fileLabel: "Failed_Clearance_Inspection_Record",
  accent: "#b23a2f",
  cover: { fields: COMMON_COVER(false, false), reportFields: ["dateOfIssue"] },
  sections: [
    {
      id: "s1", title: "1.0 INTRODUCTION",
      blocks: [
        { type: "text", key: "introduction", rows: 4, def:
`This Failed Clearance Inspection Record has been prepared by AirSafe Ltd following a clearance inspection undertaken at the site detailed in Section 3.0 of this report.

The purpose of this inspection was to determine whether the asbestos removal works had been completed in accordance with the Health and Safety at Work (Asbestos) Regulations 2016, the Approved Code of Practice for the Management and Removal of Asbestos (Nov 2016), and current WorkSafe New Zealand guidance.` }
      ]
    },
    {
      id: "s2", title: "2.0 SUMMARY",
      blocks: [
        { type: "text", key: "summary", rows: 5, def:
`A clearance inspection was undertaken to assess whether the asbestos removal works met the required clearance criteria.

Based on the findings outlined in this report, clearance has NOT been achieved.

As far as can be determined from the inspection, the asbestos removal area may pose a risk to health and safety from exposure to asbestos and is therefore not suitable for reoccupation or further works at this time.` },
        { type: "field", key: "determination", label: "Clearance Determination", fieldType: "select",
          options: ["Clearance NOT achieved – remedial works required", "Clearance achieved"],
          def: "Clearance NOT achieved – remedial works required" },
        { type: "text", key: "determinationNote", rows: 1, def:
`This determination is based on the inspection findings detailed within this report.` }
      ]
    },
    {
      id: "s3", title: "3.0 SITE AND SCOPE DETAILS",
      blocks: [
        { type: "sub", text: "Client Information" },
        ...CLIENT_INFO_BLOCKS,
        { type: "sub", text: "3.1 Date and Time of Inspection" },
        { type: "fieldpair", keys: ["inspDate", "inspTime"], labels: ["Date", "Time"], types: ["date", "time"] },
        { type: "field", key: "siteAddress3", label: "3.2 Site Address" },
        { type: "field", key: "supervisor", label: "3.3 Licensed Asbestos Removal Company Supervisor Name and Permit Number" },
        { type: "field", key: "removalCompany", label: "3.4 Licensed Asbestos Removal Company Name and Permit Number" },
        { type: "sub", text: "3.5 Asbestos Removal Location" },
        { type: "text", key: "removalLocation", rows: 2, def: "" },
        { type: "sub", text: "3.6 Scope of Works" },
        { type: "text", key: "scopeOfWorks", rows: 5, def:
`The list of removed Friable/non-friable Asbestos Containing Materials (ACMs):
• xxxx
• xxxx
• xxxx` },
        { type: "sub", text: "3.7 Specific Areas Inspected" },
        { type: "text", key: "areasInspected", rows: 5, def:
`The inspection of specified Asbestos removal work areas (post removal of ACMs):
• xxxx
• xxxx
• xxxx` }
      ]
    },
    {
      id: "s4", title: "4.0 INSPECTION DETAILS",
      blocks: [
        { type: "text", key: "inspectionDetails", rows: 4, def:
`Upon completion of asbestos removal activities, a visual clearance inspection was undertaken by AirSafe Ltd.

The inspection was limited to visible and accessible areas only.

The Asbestos Removal Control Plan (ARCP), WorkSafe Notification, and associated site documentation were reviewed prior to and during the inspection to confirm the scope of works and defined work areas.` }
      ]
    },
    {
      id: "s5", title: "5.0 FINDINGS",
      blocks: [
        { type: "text", key: "findingsIntro", rows: 1, def: "The following observations were recorded during the clearance inspection:" },
        { type: "table", key: "t51", title: "5.1 Visual Inspection Findings", itemHeader: "Observation", verHeader: "Yes / No", items: [
          "Residual asbestos debris observed", "Incomplete removal of ACMs identified", "Contamination of work area observed",
          "Contamination of surrounding / transit areas identified", "Work area not adequately cleaned" ] },
        { type: "table", key: "t52", title: "5.2 Clearance Airborne Fibre Monitoring (if applicable)", itemHeader: "Observation", verHeader: "Yes / No", items: [
          "Clearance airborne fibre monitoring undertaken (following surface disturbance testing)" ] },
        { type: "text", key: "monitoringStatements", rows: 6, def:
`Class B – Optional Airborne Fibre Monitoring Statements (Delete as Required)

[DELETE IF NOT REQUIRED – Standard Class B Option]
Clearance airborne fibre monitoring and surface disturbance testing were not undertaken as this was a non-friable (Class B) asbestos removal project and was not considered necessary.

[DELETE IF NOT REQUIRED – Additional Verification Option]
Clearance airborne fibre monitoring was undertaken following surface disturbance testing as an additional health and safety precaution measure.

[DELETE IF NOT REQUIRED – Monitoring Failure Option]
The laboratory analysis results of the airborne asbestos fibre monitoring, conducted using the membrane filter method in accordance with NOHSC:3003 (2005) and following WorkSafe New Zealand guidance, reported airborne fibre concentrations exceeding the trace level of 0.01 f/mL. As a result, the area does not meet the required health and safety clearance standards (refer to PROLAB Airborne Asbestos Monitoring Report in Appendix B).` },
        { type: "sub", text: "5.3 Additional Comments" },
        { type: "text", key: "additionalComments", rows: 5, def:
`Provide specific details of failed areas, including locations and extent of contamination:
• [INSERT DETAILS]
• [INSERT DETAILS]

Refer to Appendix A for photographic evidence.` }
      ]
    },
    {
      id: "s6", title: "6.0 REASON FOR FAILED CLEARANCE",
      blocks: [
        { type: "text", key: "failReason", rows: 4, def:
`Based on the findings detailed in Section 5.0, the asbestos removal works do not meet the required clearance criteria.

Visible asbestos debris, contamination, and/or incomplete removal of ACMs remain within the inspected areas.

As a result, the asbestos removal area does not meet the requirements for clearance and may pose a risk to health and safety.` }
      ]
    },
    {
      id: "s7", title: "7.0 REQUIRED REMEDIAL ACTIONS",
      blocks: [
        { type: "text", key: "remedialActions", rows: 6, def:
`The following actions must be completed prior to any re-inspection:
• Removal of all remaining ACMs
• Thorough cleaning of all affected areas
• Removal of all visible asbestos debris
• Decontamination of surrounding and transit areas
• Any additional remedial actions as required` }
      ]
    },
    {
      id: "s8", title: "8.0 RE-INSPECTION REQUIREMENT",
      blocks: [
        { type: "text", key: "reinspection", rows: 3, def:
`A further clearance inspection must be undertaken by a licensed asbestos assessor following completion of all remedial works.

No reoccupation, demolition, or refurbishment works are to be undertaken until clearance has been successfully achieved.` }
      ]
    },
    {
      id: "s9", title: "9.0 ASSESSOR'S DECLARATION",
      blocks: [
        { type: "text", key: "declaration", rows: 3, def:
`It is the opinion of the AirSafe assessor that clearance has NOT been achieved.

The asbestos removal area is not suitable for reoccupation or further works, and may pose a risk to health and safety from exposure to asbestos.` }
      ]
    },
    {
      id: "s10", title: "10.0 ASSESSOR DETAILS",
      blocks: [
        { type: "sub", text: "Failed Clearance Inspection Issued by and Assessor's Licence Number" },
        { type: "sigtext", key: "issuedBy", rows: 3, def: "Ahmad Shendi\nLicensed Asbestos Assessor – AA17040065\nBSc, PGDipSci (EnvMan), MSc (Hons)" }
      ]
    },
    { id: "appA", title: "APPENDIX A — Photographs", photos: true, blocks: [] },
    { id: "appB", title: "APPENDIX B — Photographs", photos: true, attachments: true, blocks: [] },
    { id: "appC", title: "APPENDIX C — Photographs", photos: true, attachments: true, blocks: [] }
  ]
};

/* =========================================================================
   MOBILE DCU CLEARANCE REPORT
   ========================================================================= */
const TPL_DCU = {
  id: "dcu",
  tileName: "Mobile DCU Clearance Report",
  shortName: "Mobile DCU Clearance Certificate",
  subtitle: "Mobile DCU Clearance",
  docTitle: "MOBILE DCU ASBESTOS CLEARANCE CERTIFICATE",
  fileLabel: "Mobile_DCU_Clearance_Certificate",
  accent: "#0f766e",
  cover: { fields: COMMON_COVER(true, true), reportFields: ["dateOfIssue", "workOrder", "arcpReviewed"] },
  sections: [
    {
      id: "s1", title: "1.0 CERTIFICATE SUMMARY",
      blocks: [
        { type: "sub", text: "1.1 Summary" },
        { type: "text", key: "summary", rows: 8, def:
`This DCU Clearance Certificate certifies that, in the opinion of Ahmad Shendi (Licence No. AA17040065) of AirSafe Ltd, the Decontamination Unit (DCU) detailed within this report has undergone clearance inspection in accordance with WorkSafe New Zealand guidance.

Furthermore, Ahmad Shendi of AirSafe Ltd is of the opinion that, as far as can be determined from the clearance inspection, the DCU does not pose a risk to health and safety from exposure to asbestos and is suitable for reuse.

OR (FAILED VERSION – KEEP THIS OPTION)
This DCU Clearance Certificate certifies that, in the opinion of Ahmad Shendi (Licence No. AA17040065) of AirSafe Ltd, the Decontamination Unit (DCU) detailed within this report has NOT achieved clearance.

Furthermore, Ahmad Shendi of AirSafe Ltd is of the opinion that, as far as can be determined from the clearance inspection, the DCU may pose a risk to health and safety from exposure to asbestos and is not suitable for reuse.

Please note; all of AirSafe’s document(s) and/or information, including Clearance Inspection Certificates and reports, cannot be reproduced or reviewed except in full. All documents and reports are prepared for the client’s objectives and scope of works, and thus should not be used by any third party as a basis for future decision-making.` }
      ]
    },
    { id: "s2", title: "2.0 CLIENT INFORMATION", blocks: CLIENT_INFO_BLOCKS },
    {
      id: "s3", title: "3.0 REMOVAL INFORMATION",
      blocks: [
        { type: "sub", text: "3.1 Date and Time of Inspection" },
        { type: "fieldpair", keys: ["inspDate", "inspTime"], labels: ["Date", "Time"], types: ["date", "time"] },
        { type: "sub", text: "3.2 Mobile DCU Details" },
        { type: "field", key: "dcuDescription", label: "DCU Description" },
        { type: "field", key: "dcuManufacturer", label: "Manufacturer" },
        { type: "field", key: "dcuSerial", label: "Serial Number" },
        { type: "field", key: "dcuRegistration", label: "Registration (if applicable)" },
        { type: "field", key: "supervisor", label: "3.3 Licensed Asbestos Removal Company Supervisor Name and Permit Number" },
        { type: "field", key: "removalCompany", label: "3.4 Licensed Asbestos Removal Company Name and Permit Number" },
        { type: "sub", text: "3.5 Mobile DCU Location at Time of Inspection" },
        { type: "text", key: "dcuLocation", rows: 2, def: "" }
      ]
    },
    {
      id: "s4", title: "4.0 VISUAL CLEARANCE INSPECTION",
      blocks: [
        { type: "sub", text: "4.1 Inspection Details" },
        { type: "text", key: "inspectionDetails", rows: 5, def:
`Upon completion of asbestos removal works, a clearance inspection of the Mobile Decontamination Unit (DCU) was undertaken by AirSafe.

All works were undertaken in accordance with:
• Health and Safety at Work (Asbestos) Regulations 2016
• Approved Code of Practice for the Management and Removal of Asbestos (Nov 2016)
• Good Practice Guidelines for Conducting Asbestos Air Monitoring and Clearance Inspections (April 2026)` },
        { type: "sub", text: "4.2 Stage 1 – Visual Inspection" },
        { type: "text", key: "stage1Intro", rows: 2, def:
`A thorough visual inspection of the DCU was undertaken to confirm that, as far as reasonably practicable, all visible and accessible areas were free from asbestos contamination.` },
        { type: "table", key: "t42", title: "Stage 1 Checklist", itemHeader: "Observation", verHeader: "Yes / No", items: [
          "Clean end visually free from contamination", "Shower area visually free from contamination",
          "Dirty end visually free from contamination", "No visible asbestos debris present",
          "DCU free of waste materials / contaminated PPE" ] },
        { type: "text", key: "stage1Note", rows: 1, def:
`See Appendix A for attached Photographs prior and following the removal of ACMs.` },
        { type: "sub", text: "4.3 Stage 2 – Clearance Airborne Fibre Monitoring (Mobile DCU Internal Clearance)" },
        { type: "text", key: "stage2Intro", rows: 4, def:
`Clearance airborne fibre monitoring was undertaken within the DCU following surface disturbance testing.

Clearance Airborne Fibre Monitoring was undertaken on DATE.

IANZ Accredited Clearance Airborne Fibre Monitoring was conducted using the membrane filter method and in accordance with AirSafe’s in-house technical procedures after a visual inspection of the mobile DCU unit has been completed “as far as reasonably practicable” to a satisfactory level and to an acceptable industry standard.` },
        { type: "table", key: "t43", title: "Stage 2 Checklist", itemHeader: "Observation", verHeader: "Yes / No", items: [
          "DCU surfaces dry prior to testing", "Surface disturbance undertaken (brushing/sweeping)",
          "Sampling undertaken in dirty end and shower" ] },
        { type: "sub", text: "Sampling Details" },
        { type: "field", key: "numSamples", label: "Number of Samples" },
        { type: "fieldpair", keys: ["approxArea", "disturbanceTime"], labels: ["Approximate Area (m²)", "Disturbance Time (minutes)"], types: ["text", "text"] },
        { type: "field", key: "dcuResult", label: "Results — DCU Interior Sample (f/mL)" },
        { type: "text", key: "monitoringStatement", rows: 5, def:
`Monitoring Statement (KEEP / DELETE AS REQUIRED)

The laboratory analysis results of the airborne asbestos fibre monitoring reported less than the minimum detection limit of the method, which is <0.01 f/mL (refer to PROLAB Airborne Asbestos Monitoring Report xxxxx). See Appendix B for details.

OR

The laboratory analysis results of the airborne asbestos fibre monitoring reported above the minimum detection limit of the method, which is <0.01 f/mL (refer to PROLAB Airborne Asbestos Monitoring Report xxxxx), and therefore, does not meet clearance requirements. See Appendix B for details.` }
      ]
    },
    {
      id: "s5", title: "5.0 REASON FOR FAILED CLEARANCE",
      blocks: [
        { type: "text", key: "failReason", rows: 5, def:
`(DELETE SECTION IF PASSED)
The DCU does not meet clearance requirements due to: (DELETE REASONS THAT DON'T APPLY)
• Presence of visible contamination
• Incomplete decontamination
• Airborne fibre concentrations exceeding the trace level` }
      ]
    },
    {
      id: "s6", title: "6.0 REQUIRED REMEDIAL ACTIONS",
      blocks: [
        { type: "text", key: "remedialActions", rows: 4, def:
`(DELETE SECTION IF PASSED)
• Further cleaning of all internal DCU surfaces
• Removal of all visible contamination
• Re-testing following remediation` }
      ]
    },
    {
      id: "s7", title: "7.0 NOTES AND LIMITATIONS",
      blocks: [
        { type: "text", key: "notesLimitations", rows: 14, def:
`All inspections are conducted in a professional manner, with due diligence and proper care. However, due to the disproportionate costs of potential damages or liability in relation to the cost of consultancy services, AirSafe is unable to guarantee that all related ACMs and associated hazard issues have been identified and/or addressed.

This Clearance Certificate is limited to a visual inspection of the Mobile Decontamination Unit (DCU) and applies only to visible and accessible areas within the clean end, shower area, and dirty end at the time of inspection.

This Visual Clearance Inspection relates only to the condition of the DCU at the time of inspection and does not constitute a full asbestos survey.

This inspection does not include intrusive investigation or dismantling of the DCU, and does not assess internal components such as wall cavities, service ducts, plumbing connections, or filtration systems unless otherwise specified.

The inspection reflects the condition of the DCU at the time it was assessed. AirSafe accepts no responsibility for any contamination that may occur after the inspection as a result of ongoing or future use.

The visual inspection describes the observed conditions within the areas inspected at the time of assessment. There is a possibility that conditions may change due to further use or activities, and therefore this Clearance Certificate must not be considered accurate beyond the time of inspection.

AirSafe accepts no responsibility or liability for the work carried out by the Licensed Asbestos Removal Contractor, including the cleaning, operation, and maintenance of the DCU.

The inspection does not verify the effectiveness or performance of filtration systems, airflow, or pressure differentials within the DCU.

It is the obligation of the Licensed Asbestos Removal Contractor to ensure the safety of their work and that the DCU is maintained in a clean and serviceable condition in accordance with relevant legislation, guidelines, and approved procedures.

This document should not be utilized or relied upon for any purpose unless the recipient acknowledges and accepts the exclusions and limitations outlined within this document.` }
      ]
    },
    {
      id: "s8", title: "8.0 MOBILE DCU CLEARANCE DECLARATION",
      blocks: [
        { type: "field", key: "declaration", label: "Declaration", fieldType: "select",
          options: ["CLEARED for reuse", "NOT CLEARED for reuse"], def: "CLEARED for reuse" },
        { type: "text", key: "declarationNote", rows: 5, def:
`AirSafe is of the opinion that the DCU has been inspected and assessed as far as reasonably practicable.

The inspection is limited to visible and accessible areas only, and based on conditions at the time of inspection.

All of AirSafe’s document(s) and/or information, including Clearance Inspection Certificates and reports, cannot be reproduced or reviewed except in full. All documents and reports are prepared for the client’s objectives and scope of works, and thus should not be used by any third party as a basis for future decision-making.

While AirSafe carries out the work to the best of our ability, AirSafe shall have no liability to the Client and/or other associated third parties whatsoever for any loss, damage or expenses arising out of the performance or non-performance of the service.` },
        ...SIGNATURE_BLOCKS
      ]
    },
    { id: "appA", title: "APPENDIX A — Photographs", photos: true, blocks: [] },
    { id: "appB", title: "APPENDIX B — Photographs", photos: true, attachments: true, blocks: [] },
    { id: "appC", title: "APPENDIX C — Photographs", photos: true, attachments: true, blocks: [] }
  ]
};

const TEMPLATES = { classA: TPL_CLASS_A, classB: TPL_CLASS_B, failed: TPL_FAILED, dcu: TPL_DCU };
const TEMPLATE_ORDER = ["classA", "classB", "failed", "dcu"];
