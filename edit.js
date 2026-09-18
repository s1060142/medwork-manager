const fs = require("fs");
const path = "C:/github/medwork-manager/medwork-frontend/src/components/CompanyGroupsCenter.jsx";
let c = fs.readFileSync(path, "utf8");
const crlf = String.fromCharCode(13, 10);
const o1 = "  const [createGroupDialog, setCreateGroupDialog] = useState(false)" + crlf + "  const [addCompanyDialog, setAddCompanyDialog] = useState(false)";
const n1 = o1 + crlf + "  const [editGroupDialog, setEditGroupDialog] = useState(false)";
if (!c.includes(o1)) { console.error("E1 FAIL"); process.exit(1); }
c = c.replace(o1, n1, 1);
console.log("Edit 1 OK");
fs.writeFileSync(path, c, "utf8");
console.log("Saved 1");

// EDIT 2
const o2 = "  const [newGroupForm, setNewGroupForm] = useState({" + crlf + "    name: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    legalName: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    vatNumber: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    taxCode: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    address: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    city: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    postalCode: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    province: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    singleArchive: true," + crlf + "    type: 99," + crlf + "    status: 1," + crlf + "    isActive: true," + crlf + "    propagateProtocols: true," + crlf + "    propagateRiskFactors: true," + crlf + "    propagateDoctors: false," + crlf + "    propagateVisitSchedules: false," + crlf + "    consolidatedBilling: false," + crlf + "  })";
const n2 = o2 + crlf + "  const [editGroupForm, setEditGroupForm] = useState({" + crlf + "    name: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    legalName: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    vatNumber: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    taxCode: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    address: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    city: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    postalCode: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    province: " + String.fromCharCode(39) + String.fromCharCode(39) + "," + crlf + "    singleArchive: true," + crlf + "  })";
if (!c.includes(o2)) { console.error("E2 FAIL"); process.exit(1); }
c = c.replace(o2, n2, 1);
console.log("Edit 2 OK");
fs.writeFileSync(path, c, "utf8");
console.log("Saved 2");
