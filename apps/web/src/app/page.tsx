"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  Building,
  LayoutDashboard,
  Plus,
  Trash,
  PlusCircle,
  LogOut,
  Globe,
  CreditCard,
  TrendingUp,
  UserPlus,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Search,
  Percent,
  Warehouse,
  FolderPlus,
  Coins,
  QrCode,
  Wrench,
  Briefcase,
  Cpu,
  Layers,
  Calendar,
  Settings,
  Lock,
  History,
  Scale,
  Wallet,
  AlertTriangle
} from "lucide-react";

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.")) {
      return "https://saas-ybcv.onrender.com";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

export default function Home() {
  const [apiUrl, setApiUrl] = useState(() => getApiUrl());
  const API_BASE_URL = apiUrl;

  // --- AUTH STATE ---
  const [token, setToken] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding Wizard step: 1 (Email & Password), 2 (Email Verification Screen), 3 (Business Data), 4 (Provisioning Simulation)
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [provisioningProgress, setProvisioningProgress] = useState(0);
  const [provisioningMsg, setProvisioningMsg] = useState("");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEnteredCode, setUserEnteredCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  // Onboarding form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBusinessName, setRegBusinessName] = useState("");
  const [regSubdomain, setRegSubdomain] = useState("");
  const [regIndustryType, setRegIndustryType] = useState("RETAIL");
  const [regPlanName, setRegPlanName] = useState("BUSINESS");

  // --- CORE DATA STATE ---
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // --- TEMPLATE-SPECIFIC INTERACTIVE DATA (SEEDED IN DB) ---
  const [projects, setProjects] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [serviceTasks, setServiceTasks] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // --- SUPPLIERS & PURCHASES STATE ---
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierTax, setNewSupplierTax] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseWarehouseId, setPurchaseWarehouseId] = useState("");
  const [purchaseOrderNum, setPurchaseOrderNum] = useState("");
  const [purchaseVariantId, setPurchaseVariantId] = useState("");
  const [purchaseQty, setPurchaseQty] = useState(10);
  const [purchaseCost, setPurchaseCost] = useState(5.0);
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split("T")[0]);

  // --- GARAGE WORKSHOP STATE ---
  const [appCustomer, setAppCustomer] = useState("");

  // --- SETTINGS STATE ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("USD");
  const [settingsLoading, setSettingsLoading] = useState(false);

  // --- UI NAVIGATION & GENERAL STATE ---
  const formatMoney = (amount: number | string) => {
    const numericAmount = typeof amount === "string" ? Number(amount) : amount;
    const currency = tenantProfile?.currency || "SAR";
    let symbol = currency;
    if (currency === "USD") symbol = "$";
    else if (currency === "SAR") symbol = "ر.س";
    else if (currency === "EGP") symbol = "ج.م";
    else if (currency === "AED") symbol = "د.إ";
    return `${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  };

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- MODALS / SUB-FORMS STATE ---
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustTax, setNewCustTax] = useState("");
  const [newCustLimit, setNewCustLimit] = useState(1000);
  const [newCustShipping, setNewCustShipping] = useState("");
  const [newCustBilling, setNewCustBilling] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdBrand, setNewProdBrand] = useState("");
  const [newProdSKU, setNewProdSKU] = useState("");
  const [newProdBarcode, setNewProdBarcode] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(99.99);
  const [newProdCost, setNewProdCost] = useState(60.0);
  const [newProdColor, setNewProdColor] = useState("Graphite");

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpAmount, setNewExpAmount] = useState(50);
  const [newExpCategory, setNewExpCategory] = useState("UTILITIES");
  const [newExpDesc, setNewExpDesc] = useState("");

  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWhName, setNewWhName] = useState("");
  const [newWhAddress, setNewWhAddress] = useState("");

  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [adjWarehouseId, setAdjWarehouseId] = useState("");
  const [adjVariantId, setAdjVariantId] = useState("");
  const [adjQty, setAdjQty] = useState(100);

  // --- TEMPLATE MODALS STATE ---
  const [showAddProject, setShowAddProject] = useState(false);
  const [projName, setProjName] = useState("");
  const [projClient, setProjClient] = useState("");
  const [projAmount, setProjAmount] = useState(5000);
  const [projMeas, setProjMeas] = useState("");
  const [projNotes, setProjNotes] = useState("");

  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [appVehicle, setAppVehicle] = useState("");
  const [appService, setAppService] = useState("");
  const [appAdvisor, setAppAdvisor] = useState("سعود القحطاني");
  const [appMechanic, setAppMechanic] = useState("م. أشرف عبد العزيز");
  const [appCost, setAppCost] = useState(500);

  const [showAddProduction, setShowAddProduction] = useState(false);
  const [prodOrdProduct, setProdOrdProduct] = useState("");
  const [prodOrdMaterials, setProdOrdMaterials] = useState("");
  const [prodOrdQty, setProdOrdQty] = useState(100);
  const [prodOrdMachine, setProdOrdMachine] = useState("خط الخياطة الدائرية A");
  const [prodOrdSupervisor, setProdOrdSupervisor] = useState("م. محمود جلال");

  // --- POS CART STATE ---
  const [posWarehouseId, setPosWarehouseId] = useState("");
  const [posCustomerId, setPosCustomerId] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState("CARD");
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [posAmountPaid, setPosAmountPaid] = useState("");
  const [posCheckoutSuccess, setPosCheckoutSuccess] = useState<any>(null);

  // --- SHIFTS & RECONCILIATION ---
  const [activeShift, setActiveShift] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftOpeningBalance, setShiftOpeningBalance] = useState("0");
  const [shiftActualCash, setShiftActualCash] = useState("0");
  const [shiftNotes, setShiftNotes] = useState("");

  // --- BOM & TAX RATES ---
  const [boms, setBoms] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("15");

  // --- WORKSHOP / REPAIR MATERIALS ---
  const [projectMaterials, setProjectMaterials] = useState<any[]>([]);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedProjectIdForMaterials, setSelectedProjectIdForMaterials] = useState<string | null>(null);
  const [newMaterialVariantId, setNewMaterialVariantId] = useState("");
  const [newMaterialQty, setNewMaterialQty] = useState("1");

  // --- MEASUREMENT HISTORY ---
  const [measurementHistory, setMeasurementHistory] = useState<any[]>([]);

  // --- EFFECTS ---
  useEffect(() => {
    // Read token from localStorage on mount
    const savedToken = localStorage.getItem("crm_access_token");
    if (savedToken) {
      setToken(savedToken);
      decodeTenantFromToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllData();
      // Check if it's the first time setup using localStorage
      if (isFirstTimeSetup) {
        setShowWelcomeModal(true);
      }
    }
  }, [token]);

  // Handle system provisioning animation flow
  useEffect(() => {
    if (authMode === "register" && regStep === 4) {
      setProvisioningProgress(5);
      setProvisioningMsg("جاري الاتصال بقاعدة البيانات السحابية وتجهيز البيئة الحية...");
      
      const interval = setInterval(() => {
        setProvisioningProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          const nextVal = prev + Math.floor(Math.random() * 15) + 5;
          if (nextVal < 35) {
            setProvisioningMsg("جاري تأسيس هيكل الجداول وربط مستودعات البيانات...");
          } else if (nextVal < 75) {
            const indText = getIndustryNameArabic(regIndustryType);
            setProvisioningMsg(`تحميل التهيئة الإعدادية المخصصة لقطاع (${indText})...`);
          } else {
            setProvisioningMsg(`ربط مساحة العمل بنطاقك السحابي الخاص: ${regSubdomain}.crmsaas.app...`);
          }
          return nextVal > 95 ? 95 : nextVal;
        });
      }, 500);

      // Perform registration action once provisioning finishes simulation
      const timeout = setTimeout(async () => {
        clearInterval(interval);
        setProvisioningProgress(100);
        setProvisioningMsg("اكتمل تجهيز النظام! جاري تشغيل مساحة العمل الخاصة بك...");
        
        // Execute registration api call
        await executeRegisterAPI();
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [regStep]);

  // Decode basic tenant/user claims from standard JWT payload part
  const decodeTenantFromToken = (jwtToken: string) => {
    try {
      const payloadPart = jwtToken.split(".")[1];
      if (payloadPart) {
        const decoded = JSON.parse(atob(payloadPart));
        setTenantInfo(decoded);
        
        // Check local storage to see if welcome modal was already shown for this subdomain
        const onboardedKey = `onboarded_${decoded.subdomain}`;
        if (localStorage.getItem(onboardedKey)) {
          setShowWelcomeModal(false);
          setIsFirstTimeSetup(false);
        }
      }
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  };

  // --- API CALLS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشلت عملية تسجيل الدخول. يرجى التحقق من البيانات.");
      }
      localStorage.setItem("crm_access_token", data.accessToken);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("تم تسجيل الدخول بنجاح! مرحباً بك.");
    } catch (err: any) {
      setErrorMsg(err.message || "فشل الاتصال بالخادم.");
    } finally {
      setAuthLoading(false);
    }
  };

  const executeRegisterAPI = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: regFirstName,
          lastName: regLastName,
          email: regEmail,
          password: regPassword,
          businessName: regBusinessName,
          subdomain: regSubdomain,
          industryType: regIndustryType,
          planName: regPlanName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg || "فشل تسجيل المنشأة. تحقق من القيم المدخلة.");
      }
      localStorage.setItem("crm_access_token", data.accessToken);
      setIsFirstTimeSetup(true);
      setToken(data.accessToken);
      decodeTenantFromToken(data.accessToken);
      showTemporarySuccess("تم تأسيس وتهيئة نظامك بنجاح! أهلاً بك.");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء الاتصال بالخادم وتجهيز النظام.");
      setRegStep(3); // return back to step 3 so they can edit subdomain/details
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_access_token");
    setToken(null);
    setTenantInfo(null);
    setCustomers([]);
    setProducts([]);
    setWarehouses([]);
    setInvoices([]);
    setExpenses([]);
    setPosCart([]);
    setPosCheckoutSuccess(null);
    setActiveTab("dashboard");
    setIsFirstTimeSetup(false);
    setShowWelcomeModal(false);
  };

  const fetchAllData = async () => {
    if (!token) return;
    setDataLoading(true);
    setErrorMsg(null);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 0. Fetch Tenant Profile (Modules, Workflows, Widgets configuration)
      const profileRes = await fetch(`${API_BASE_URL}/tenant/profile`, { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setTenantProfile(profileData);
        setSettingsName(profileData.name || "");
        setSettingsCurrency(profileData.currency || "USD");
      }

      // 1. Fetch Customers
      const custRes = await fetch(`${API_BASE_URL}/customers`, { headers });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }

      // 2. Fetch Products
      const prodRes = await fetch(`${API_BASE_URL}/products`, { headers });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // 3. Fetch Warehouses
      const whRes = await fetch(`${API_BASE_URL}/warehouses`, { headers });
      if (whRes.ok) {
        const whData = await whRes.json();
        setWarehouses(whData);
        if (whData.length > 0 && !posWarehouseId) {
          setPosWarehouseId(whData[0].id);
        }
        if (whData.length > 0 && !purchaseWarehouseId) {
          setPurchaseWarehouseId(whData[0].id);
        }
      }

      // 4. Fetch Invoices
      const invRes = await fetch(`${API_BASE_URL}/invoices`, { headers });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
      }

      // 5. Fetch Expenses
      const expRes = await fetch(`${API_BASE_URL}/expenses`, { headers });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData);
      }

      // 6. Fetch Suppliers
      const supRes = await fetch(`${API_BASE_URL}/suppliers`, { headers });
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(supData);
      }

      // 7. Fetch Purchases
      const purRes = await fetch(`${API_BASE_URL}/purchases`, { headers });
      if (purRes.ok) {
        const purData = await purRes.json();
        setPurchases(purData);
      }

      // 8. Fetch Vehicles
      const vehRes = await fetch(`${API_BASE_URL}/vehicles`, { headers });
      if (vehRes.ok) {
        const vehData = await vehRes.json();
        setVehicles(vehData);
      }

      // 9. Fetch Production Orders
      const productionRes = await fetch(`${API_BASE_URL}/production`, { headers });
      if (productionRes.ok) {
        const prodOrdersData = await productionRes.json();
        setProductionOrders(prodOrdersData.map((po: any) => ({
          id: po.id,
          product: po.productName,
          rawMaterials: po.rawMaterials,
          status: po.status,
          quantity: po.quantity,
          machine: po.machineName,
          supervisor: po.supervisorName
        })));
      }

      // 10. Fetch Projects & Work Orders
      const projectsRes = await fetch(`${API_BASE_URL}/projects`, { headers });
      if (projectsRes.ok) {
        const projData = await projectsRes.json();
        
        // Custom Furniture/General projects (where vehicleId is null)
        setProjects(projData.filter((p: any) => p.vehicleId === null).map((p: any) => ({
          id: p.id,
          name: p.name,
          client: p.customer?.name || "عميل غير معروف",
          amount: Number(p.amount),
          measurements: p.measurements?.text || "لم تسجل مقاسات بعد",
          notes: p.notes,
          status: p.status,
          date: new Date(p.createdAt).toISOString().split("T")[0]
        })));

        // Car repair appointments (where vehicleId is NOT null)
        setAppointments(projData.filter((p: any) => p.vehicleId !== null).map((p: any) => ({
          id: p.id,
          vehicle: p.vehicle ? `${p.vehicle.brand} ${p.vehicle.model} (${p.vehicle.plateNumber})` : "سيارة عميل",
          service: p.name,
          status: p.status,
          time: new Date(p.createdAt).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' }),
          advisor: p.notes || "سعود القحطاني",
          mechanic: p.description || "م. أشرف عبد العزيز",
          cost: Number(p.amount)
        })));

        // Service Tasks
        setServiceTasks(projData.filter((p: any) => p.vehicleId === null).map((p: any) => ({
          id: p.id,
          title: p.name,
          client: p.customer?.name || "عميل غير معروف",
          status: p.status,
          assignee: p.description || "قيد التعيين",
          deadline: p.notes || "لم يحدد موعد",
          budget: Number(p.amount)
        })));
      }

      // 11. Fetch Active Shift
      const activeShiftRes = await fetch(`${API_BASE_URL}/shifts/active`, { headers });
      if (activeShiftRes.ok) {
        const activeShiftData = await activeShiftRes.json();
        setActiveShift(activeShiftData || null);
      } else {
        setActiveShift(null);
      }

      // 12. Fetch Shifts history
      const shiftsRes = await fetch(`${API_BASE_URL}/shifts`, { headers });
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(shiftsData);
      }

      // 13. Fetch BOMs
      const bomsRes = await fetch(`${API_BASE_URL}/boms`, { headers });
      if (bomsRes.ok) {
        const bomsData = await bomsRes.json();
        setBoms(bomsData);
      }

      // 14. Fetch Tax Rates
      const taxRatesRes = await fetch(`${API_BASE_URL}/tax-rates`, { headers });
      if (taxRatesRes.ok) {
        const taxRatesData = await taxRatesRes.json();
        setTaxRates(taxRatesData);
      }
    } catch (err: any) {
      setErrorMsg("فشلت عملية مزامنة البيانات مع الخادم الرئيسي.");
    } finally {
      setDataLoading(false);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // --- TEMPLATE ACTIONS (SAVED IN CLOUD DB) ---
  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!projClient) {
      setErrorMsg("يرجى اختيار عميل أولاً للمشروع.");
      return;
    }
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: projClient,
          name: projName,
          amount: Number(projAmount),
          measurements: projMeas ? { text: projMeas } : undefined,
          notes: projNotes,
          status: "LEAD"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشلت عملية حفظ المشروع.");

      setShowAddProject(false);
      setProjName("");
      setProjClient("");
      setProjAmount(5000);
      setProjMeas("");
      setProjNotes("");
      fetchAllData();
      showTemporarySuccess("تم تسجيل المشروع الجديد وحفظه بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!appCustomer) {
      setErrorMsg("يرجى اختيار عميل صيانة.");
      return;
    }
    setErrorMsg(null);
    try {
      // 1. Create vehicle
      const vehRes = await fetch(`${API_BASE_URL}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: appCustomer,
          plateNumber: appVehicle,
          brand: "سيارة",
          model: "عميل",
          year: new Date().getFullYear(),
          notes: "سجلت تلقائياً"
        })
      });
      const vehData = await vehRes.json();
      if (!vehRes.ok) throw new Error(vehData.message || "فشل إدراج مركبة الصيانة.");

      // 2. Create work order project
      const projRes = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: appCustomer,
          vehicleId: vehData.id,
          name: appService,
          amount: Number(appCost),
          notes: appAdvisor,
          description: appMechanic,
          status: "VEHICLE_CHECK_IN"
        })
      });
      const projData = await projRes.json();
      if (!projRes.ok) throw new Error(projData.message || "فشل تسجيل كارت الصيانة.");

      setShowAddAppointment(false);
      setAppVehicle("");
      setAppService("");
      setAppCost(500);
      setAppCustomer("");
      fetchAllData();
      showTemporarySuccess("تم استلام السيارة بنجاح وحفظها بقاعدة البيانات!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createProductionOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/production`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: prodOrdProduct,
          rawMaterials: prodOrdMaterials,
          quantity: Number(prodOrdQty),
          machineName: prodOrdMachine,
          supervisorName: prodOrdSupervisor,
          status: "RAW_MATERIALS"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تشغيل أمر الإنتاج.");

      setShowAddProduction(false);
      setProdOrdProduct("");
      setProdOrdMaterials("");
      setProdOrdQty(100);
      fetchAllData();
      showTemporarySuccess("تم إطلاق أمر الإنتاج وحفظه سحابياً بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- SUPPLIER & PURCHASES API ACTIONS ---
  const createSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSupplierName,
          email: newSupplierEmail || undefined,
          phone: newSupplierPhone || undefined,
          taxNumber: newSupplierTax || undefined,
          address: newSupplierAddress || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر حفظ المورد.");

      setShowSuppliersModal(false);
      setNewSupplierName("");
      setNewSupplierEmail("");
      setNewSupplierPhone("");
      setNewSupplierTax("");
      setNewSupplierAddress("");
      fetchAllData();
      showTemporarySuccess("تم إدراج المورد الجديد بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!purchaseSupplierId || !purchaseWarehouseId || !purchaseVariantId) {
      setErrorMsg("يرجى ملء جميع الحقول المطلوبة للتوريد.");
      return;
    }
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId: purchaseSupplierId,
          warehouseId: purchaseWarehouseId,
          orderNumber: purchaseOrderNum || `PO-${Date.now().toString().slice(-6)}`,
          issueDate: purchaseDate,
          items: [{
            variantId: purchaseVariantId,
            quantity: Number(purchaseQty),
            unitCost: Number(purchaseCost),
            taxRate: 15.00
          }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشلت عملية التوريد.");

      setShowPurchaseModal(false);
      setPurchaseSupplierId("");
      setPurchaseVariantId("");
      setPurchaseQty(10);
      setPurchaseCost(5.0);
      setPurchaseNotes("");
      fetchAllData();
      showTemporarySuccess("تم استلام الشحنة وتحديث رصيد المخزن والمالية فوراً!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- SAVE SETTINGS ACTION ---
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSettingsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tenant/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: settingsName,
          currency: settingsCurrency
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تعديل إعدادات المنشأة.");

      setShowSettingsModal(false);
      fetchAllData();
      showTemporarySuccess("تم تحديث إعدادات المنشأة وتغيير العملة بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // --- SHIFTS ACTIONS ---
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/shifts/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          openingBalance: Number(shiftOpeningBalance),
          notes: shiftNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل فتح الوردية.");

      setActiveShift(data);
      setShowOpenShiftModal(false);
      setShiftOpeningBalance("0");
      setShiftNotes("");
      fetchAllData();
      showTemporarySuccess("تم فتح الوردية بنجاح بنشاط الكاشير!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/shifts/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actualCash: Number(shiftActualCash),
          notes: shiftNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل إغلاق الوردية.");

      setActiveShift(null);
      setShowCloseShiftModal(false);
      setShiftActualCash("0");
      setShiftNotes("");
      fetchAllData();
      showTemporarySuccess("تم إغلاق الوردية وتسوية الخزنة بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- PROJECT MATERIALS ACTIONS ---
  const handleAddProjectMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectIdForMaterials) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${selectedProjectIdForMaterials}/materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variantId: newMaterialVariantId,
          quantity: Number(newMaterialQty),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل إضافة قطعة الغيار.");

      setNewMaterialVariantId("");
      setNewMaterialQty("1");
      fetchProjectMaterials(selectedProjectIdForMaterials);
      fetchAllData();
      showTemporarySuccess("تم إضافة قطعة الغيار وخصمها من المستودع بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRemoveProjectMaterial = async (projectId: string, materialId: string) => {
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/materials/${materialId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل إزالة قطعة الغيار.");

      fetchProjectMaterials(projectId);
      fetchAllData();
      showTemporarySuccess("تم إزالة قطعة الغيار وإعادتها للمخزن بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const fetchProjectMaterials = async (projectId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjectMaterials(data);
      }
    } catch (err) {}
  };

  const fetchMeasurementHistory = async (projectId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/measurement-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMeasurementHistory(data);
      }
    } catch (err) {}
  };

  // --- TAX RATE ACTIONS ---
  const handleCreateTaxRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tax-rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTaxName,
          rate: Number(newTaxRate),
          isDefault: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تسجيل نسبة الضريبة.");

      setNewTaxName("");
      setNewTaxRate("15");
      setShowTaxModal(false);
      fetchAllData();
      showTemporarySuccess("تم حفظ نسبة الضريبة وتفعيلها بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- BOM ACTIONS ---
  const handleCreateBOM = async (variantId: string, name: string, items: any[]) => {
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/boms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variantId,
          name,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تسجيل شجرة المواد.");

      fetchAllData();
      showTemporarySuccess("تم تسجيل شجرة المواد بنجاح وحساب تكلفة الإنتاج!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- ACTIONS ---
  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCustName,
          email: newCustEmail || undefined,
          phone: newCustPhone || undefined,
          taxNumber: newCustTax || undefined,
          creditLimit: Number(newCustLimit),
          shippingAddress: newCustShipping || undefined,
          billingAddress: newCustBilling || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل ملف العميل.");
      
      setCustomers([data, ...customers]);
      setShowAddCustomer(false);
      // Reset form
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPhone("");
      setNewCustTax("");
      setNewCustLimit(1000);
      setNewCustShipping("");
      setNewCustBilling("");
      showTemporarySuccess(`تم تسجيل العميل '${data.name}' بنجاح.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProdName,
          description: newProdDesc || undefined,
          brand: newProdBrand || undefined,
          isVariantParent: true,
          variants: [
            {
              sku: newProdSKU,
              barcode: newProdBarcode || undefined,
              price: Number(newProdPrice),
              costPrice: Number(newProdCost),
              attributes: { Color: newProdColor },
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل المنتج في الدليل.");
      
      setProducts([data, ...products]);
      setShowAddProduct(false);
      // Reset form
      setNewProdName("");
      setNewProdDesc("");
      setNewProdBrand("");
      setNewProdSKU("");
      setNewProdBarcode("");
      setNewProdPrice(99.99);
      setNewProdCost(60.0);
      showTemporarySuccess(`تم إدراج المنتج '${data.name}' مع أصنافه الخاصة بنجاح.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/warehouses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newWhName,
          address: newWhAddress || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل المستودع.");
      
      setWarehouses([...warehouses, data]);
      setShowAddWarehouse(false);
      setNewWhName("");
      setNewWhAddress("");
      showTemporarySuccess(`تم تسجيل المستودع/الفرع '${data.name}' بنجاح.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const adjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/warehouses/adjust-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: adjWarehouseId,
          variantId: adjVariantId,
          quantity: Number(adjQty),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشلت عملية تسوية المخزون.");
      
      setShowAdjustStock(false);
      fetchAllData(); // reload products to show new stock balances
      showTemporarySuccess("تم تسوية وتحديث كميات المخزن بنجاح.");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(newExpAmount),
          category: newExpCategory,
          description: newExpDesc,
          expenseDate: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر تسجيل المصروف.");
      
      setExpenses([data, ...expenses]);
      setShowAddExpense(false);
      setNewExpAmount(50);
      setNewExpDesc("");
      showTemporarySuccess("تم قيد المصروفات التشغيلية بنجاح.");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- POS CART ACTIONS ---
  const addToCart = (product: any, variant: any) => {
    const existing = posCart.find((item) => item.variantId === variant.id);
    if (existing) {
      setPosCart(
        posCart.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setPosCart([
        ...posCart,
        {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          sku: variant.sku,
          quantity: 1,
          unitPrice: Number(variant.price),
          taxRate: 15.0, // Default 15% VAT
          discountAmount: 0.0,
        },
      ]);
    }
  };

  const updateCartQty = (variantId: string, qty: number) => {
    if (qty <= 0) {
      setPosCart(posCart.filter((item) => item.variantId !== variantId));
    } else {
      setPosCart(
        posCart.map((item) => (item.variantId === variantId ? { ...item, quantity: qty } : item))
      );
    }
  };

  const calculateCartSubtotal = () => {
    return posCart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  };

  const calculateCartTax = () => {
    return posCart.reduce((acc, item) => {
      const sub = item.unitPrice * item.quantity - item.discountAmount;
      return acc + sub * (item.taxRate / 100);
    }, 0);
  };

  const calculateCartTotal = () => {
    return calculateCartSubtotal() + calculateCartTax();
  };

  const handlePOSCheckout = async () => {
    if (!token) return;
    if (!posWarehouseId) {
      setErrorMsg("يرجى اختيار مستودع أولاً للخصم منه.");
      return;
    }
    if (posCart.length === 0) {
      setErrorMsg("سلة المشتريات فارغة.");
      return;
    }
    setErrorMsg(null);
    setPosCheckoutSuccess(null);

    const total = calculateCartTotal();
    const paid = Number(posAmountPaid) || total;

    try {
      const res = await fetch(`${API_BASE_URL}/invoices/pos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: posWarehouseId,
          customerId: posCustomerId || undefined,
          paymentMethod: posPaymentMethod,
          amountPaid: paid,
          items: posCart.map((item) => ({
            variantId: item.variantId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            discountAmount: Number(item.discountAmount),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذر إتمام عملية البيع.");

      setPosCheckoutSuccess(data);
      setPosCart([]);
      setPosAmountPaid("");
      fetchAllData(); // refresh stock balances and lists
      showTemporarySuccess("تم إتمام الفاتورة وتحديث المخزون والمالية بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // --- STATS / METRICS FOR DASHBOARD ---
  const totalSales = invoices.reduce((acc, inv) => acc + Number(inv.grandTotal), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  const netProfit = totalSales - totalExpenses;
  const totalStockQty = products.reduce((acc, p) => {
    let q = 0;
    p.variants?.forEach((v: any) => {
      v.balances?.forEach((b: any) => {
        q += Number(b.quantity);
      });
    });
    return acc + q;
  }, 0);

  const getIndustryNameArabic = (type: string) => {
    switch (type) {
      case "RETAIL": return "تجارة التجزئة والمستودعات";
      case "FURNITURE": return "تصنيع وتفصيل الأثاث";
      case "GARAGE": return "ورش صيانة السيارات";
      case "FACTORY": return "المصانع وخطوط الإنتاج";
      case "SERVICE": return "الشركات الخدمية والاستشارات";
      default: return type || "تجارة التجزئة والمستودعات";
    }
  };

  const isModuleEnabled = (modId: string) => {
    if (!tenantProfile || !tenantProfile.tenantModules) {
      const currentType = tenantInfo?.industryType || regIndustryType;
      if (currentType === "FURNITURE") {
        return ["customers", "projects", "measurements", "quotations", "materials", "inventory", "production", "installations", "finance"].includes(modId);
      }
      if (currentType === "GARAGE") {
        return ["customers", "vehicles", "service_history", "appointments", "projects", "inventory", "finance"].includes(modId);
      }
      if (currentType === "FACTORY") {
        return ["inventory", "purchases", "production", "machines", "maintenance", "finance"].includes(modId);
      }
      if (currentType === "SERVICE") {
        return ["crm", "projects", "teams", "contracts", "finance"].includes(modId);
      }
      return ["products", "categories", "brands", "inventory", "warehouses", "purchases", "sales", "pos", "finance", "customers"].includes(modId);
    }
    return tenantProfile.tenantModules.some((m: any) => m.moduleId === modId && m.isEnabled);
  };

  const getProductsLabel = () => {
    const currentType = tenantInfo?.industryType || regIndustryType;
    if (currentType === "FURNITURE") return "دليل الخامات والمخازن";
    if (currentType === "GARAGE") return "قطع الغيار والمستودع";
    if (currentType === "FACTORY") return "المواد الخام والمنتجات";
    return "دليل المنتجات والمخزن";
  };

  const renderDashboardMetrics = () => {
    const currentType = tenantInfo?.industryType || regIndustryType;

    if (currentType === "FURNITURE") {
      const activeProjectsCount = projects.filter(p => p.status !== "COMPLETED").length;
      const pendingMeasurementsCount = projects.filter(p => p.status === "MEASUREMENT_VISIT").length;
      const productionCount = projects.filter(p => p.status === "PRODUCTION").length;
      const totalEstimatedAmt = projects.reduce((acc, p) => acc + p.amount, 0);

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: المقاسات المعلقة */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">المقاسات المعلقة</p>
              <h2 className="text-2xl font-black text-slate-800">
                {pendingMeasurementsCount} <span className="text-sm text-slate-400 font-normal">زيارات</span>
              </h2>
            </div>
          </div>

          {/* Card 2: مشاريع في الورشة */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">مشاريع في الورشة</p>
              <h2 className="text-2xl font-black text-slate-800">
                {productionCount} <span className="text-sm text-slate-400 font-normal">مشاريع</span>
              </h2>
            </div>
          </div>

          {/* Card 3: إجمالي قيم المشاريع */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">إجمالي قيم المشاريع</p>
              <h2 className="text-2xl font-black text-emerald-600">
                {formatMoney(totalEstimatedAmt)}
              </h2>
            </div>
          </div>

          {/* Card 4: مشاريع جارية */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 shrink-0">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">مشاريع جارية</p>
              <h2 className="text-2xl font-black text-slate-800">
                {activeProjectsCount} <span className="text-sm text-slate-400 font-normal">نشط</span>
              </h2>
            </div>
          </div>
        </div>
      );
    }

    if (currentType === "GARAGE") {
      const repairsCount = appointments.filter(a => a.status === "REPAIR").length;
      const pendingCount = appointments.filter(a => a.status === "INSPECTION").length;
      const readyCount = appointments.filter(a => a.status === "DELIVERY").length;
      const totalRevenue = appointments.reduce((acc, a) => acc + a.cost, 0);

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: سيارات قيد الفحص */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">سيارات قيد الفحص</p>
              <h2 className="text-2xl font-black text-slate-800">
                {pendingCount} <span className="text-sm text-slate-400 font-normal">سيارات</span>
              </h2>
            </div>
          </div>

          {/* Card 2: تحت الصيانة والإصلاح */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">تحت الصيانة والإصلاح</p>
              <h2 className="text-2xl font-black text-slate-800">
                {repairsCount} <span className="text-sm text-slate-400 font-normal">سيارات</span>
              </h2>
            </div>
          </div>

          {/* Card 3: دخل الصيانة الإجمالي */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">دخل الصيانة الإجمالي</p>
              <h2 className="text-2xl font-black text-emerald-600">
                {formatMoney(totalRevenue)}
              </h2>
            </div>
          </div>

          {/* Card 4: جاهزة للتسليم */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-600 shrink-0">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">جاهزة للتسليم</p>
              <h2 className="text-2xl font-black text-slate-800">
                {readyCount} <span className="text-sm text-slate-400 font-normal">سيارات</span>
              </h2>
            </div>
          </div>
        </div>
      );
    }

    if (currentType === "FACTORY") {
      const manufacturingCount = productionOrders.filter(po => po.status === "MANUFACTURING").length;
      const rawMaterialsCount = productionOrders.filter(po => po.status === "RAW_MATERIALS").length;
      const totalQty = productionOrders.reduce((acc, po) => acc + po.quantity, 0);

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: أوامر الإنتاج الجارية */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">أوامر الإنتاج الجارية</p>
              <h2 className="text-2xl font-black text-slate-800">
                {manufacturingCount} <span className="text-sm text-slate-400 font-normal">خطوط</span>
              </h2>
            </div>
          </div>

          {/* Card 2: تحضير المواد الخام */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">تحضير المواد الخام</p>
              <h2 className="text-2xl font-black text-slate-800">
                {rawMaterialsCount} <span className="text-sm text-slate-400 font-normal">طلبات</span>
              </h2>
            </div>
          </div>

          {/* Card 3: حجم الإنتاج الكلي */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">حجم الإنتاج الكلي</p>
              <h2 className="text-2xl font-black text-emerald-600">
                {totalQty.toLocaleString()} <span className="text-sm text-slate-400 font-normal">وحدة</span>
              </h2>
            </div>
          </div>

          {/* Card 4: كفاءة تشغيل المصنع */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">كفاءة تشغيل المصنع</p>
              <h2 className="text-2xl font-black text-slate-800">
                92.5%
              </h2>
            </div>
          </div>
        </div>
      );
    }

    if (currentType === "SERVICE") {
      const activeTasksCount = serviceTasks.filter(t => t.status !== "COMPLETED").length;
      const billingTasksCount = serviceTasks.filter(t => t.status === "BILLING").length;
      const totalBudget = serviceTasks.reduce((acc, t) => acc + t.budget, 0);

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: المهام والمشاريع الجارية */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">المهام والمشاريع الجارية</p>
              <h2 className="text-2xl font-black text-slate-800">
                {activeTasksCount} <span className="text-sm text-slate-400 font-normal">مهام</span>
              </h2>
            </div>
          </div>

          {/* Card 2: مرحلة الفوترة والتحصيل */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">مرحلة الفوترة والتحصيل</p>
              <h2 className="text-2xl font-black text-slate-800">
                {billingTasksCount} <span className="text-sm text-slate-400 font-normal">مشاريع</span>
              </h2>
            </div>
          </div>

          {/* Card 3: ميزانية العقود الحالية */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">ميزانية العقود الحالية</p>
              <h2 className="text-2xl font-black text-emerald-600">
                {formatMoney(totalBudget)}
              </h2>
            </div>
          </div>

          {/* Card 4: مستوى الإنتاجية */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-bold mb-1">مستوى الإنتاجية</p>
              <h2 className="text-2xl font-black text-slate-800">
                98%
              </h2>
            </div>
          </div>
        </div>
      );
    }

    // Default RETAIL
    const lowStockCount = products.filter(p => {
      let q = 0;
      p.variants?.forEach((v: any) => {
        v.balances?.forEach((b: any) => {
          q += Number(b.quantity);
        });
      });
      return q < 5;
    }).length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: إجمالي المبيعات والإيرادات */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
            <Coins className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">إجمالي المبيعات والإيرادات</p>
            <h2 className="text-2xl font-black text-slate-800 font-mono">
              {formatMoney(totalSales)}
            </h2>
          </div>
        </div>

        {/* Card 2: صافي رصيد الخزنة */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">صافي رصيد الخزنة</p>
            <h2 className="text-2xl font-black text-emerald-600 font-mono">
              {formatMoney(totalSales - totalExpenses)}
            </h2>
          </div>
        </div>

        {/* Card 3: عدد الفواتير */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">عدد الفواتير</p>
            <h2 className="text-2xl font-black text-slate-800 font-mono">
              {invoices.length} <span className="text-sm text-slate-400 font-normal">فاتورة</span>
            </h2>
          </div>
        </div>

        {/* Card 4: منتجات أوشكت على النفاذ */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 text-right">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-50 text-red-500 shrink-0">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold mb-1">منتجات أوشكت على النفاذ</p>
            <h2 className="text-2xl font-black text-slate-800 font-mono">
              {lowStockCount} <span className="text-sm text-slate-400 font-normal">منتج</span>
            </h2>
          </div>
        </div>
      </div>
    );
  };

  const advanceProjectStatus = async (id: string) => {
    if (!token) return;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    const statusFlow = ["LEAD", "MEASUREMENT_VISIT", "QUOTATION", "APPROVAL", "PRODUCTION", "INSTALLATION", "DELIVERY", "COMPLETED"];
    const idx = statusFlow.indexOf(project.status);
    const nextStatus = idx < statusFlow.length - 1 ? statusFlow[idx + 1] : statusFlow[0];

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchAllData();
        showTemporarySuccess(`تم نقل المشروع "${project.name}" إلى مرحلة (${getStatusTextArabic(nextStatus)})`);
      } else {
        const data = await res.json();
        throw new Error(data.message || "فشل تحديث حالة المشروع.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const advanceAppointmentStatus = async (id: string) => {
    if (!token) return;
    // For appointments, the ID corresponds to the project ID
    const statusFlow = ["VEHICLE_CHECK_IN", "INSPECTION", "QUOTATION", "APPROVAL", "REPAIR", "QUALITY_CHECK", "DELIVERY"];
    
    // Find in appointments to get the current status
    const app = appointments.find(a => a.id === id);
    if (!app) return;

    const idx = statusFlow.indexOf(app.status);
    const nextStatus = idx < statusFlow.length - 1 ? statusFlow[idx + 1] : statusFlow[0];

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchAllData();
        showTemporarySuccess(`تم نقل مركبة "${app.vehicle}" إلى مرحلة (${getStatusTextArabic(nextStatus)})`);
      } else {
        const data = await res.json();
        throw new Error(data.message || "فشل تحديث كارت صيانة السيارة.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const advanceProductionStatus = async (id: string) => {
    if (!token) return;
    const order = productionOrders.find(po => po.id === id);
    if (!order) return;

    const statusFlow = ["RAW_MATERIALS", "PRODUCTION_ORDER", "MANUFACTURING", "QUALITY_CHECK", "PACKAGING", "FINISHED_GOODS", "DELIVERY"];
    const idx = statusFlow.indexOf(order.status);
    const nextStatus = idx < statusFlow.length - 1 ? statusFlow[idx + 1] : statusFlow[0];

    try {
      const res = await fetch(`${API_BASE_URL}/production/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchAllData();
        showTemporarySuccess(`تم نقل أمر إنتاج "${order.product}" إلى مرحلة (${getStatusTextArabic(nextStatus)})`);
      } else {
        const data = await res.json();
        throw new Error(data.message || "فشل تحديث أمر الإنتاج.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const advanceServiceTaskStatus = async (id: string) => {
    if (!token) return;
    const task = serviceTasks.find(t => t.id === id);
    if (!task) return;

    const statusFlow = ["LEAD", "QUALIFICATION", "PROPOSAL", "CONTRACT", "PROJECT_SETUP", "BILLING", "COMPLETED"];
    const idx = statusFlow.indexOf(task.status);
    const nextStatus = idx < statusFlow.length - 1 ? statusFlow[idx + 1] : statusFlow[0];

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchAllData();
        showTemporarySuccess(`تم نقل المهمة الخدمية "${task.title}" إلى مرحلة (${getStatusTextArabic(nextStatus)})`);
      } else {
        const data = await res.json();
        throw new Error(data.message || "فشل تحديث حالة المهمة الخدمية.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const getStatusTextArabic = (status: string) => {
    switch (status) {
      case "LEAD": return "تواصل واستفسار";
      case "MEASUREMENT_VISIT": return "زيارة رفع المقاسات";
      case "QUOTATION": return "إعداد العرض المالي";
      case "APPROVAL": return "تم الاعتماد والدفعة الأولى";
      case "PRODUCTION": return "جاري التصنيع بالورشة";
      case "INSTALLATION": return "التركيب بموقع العميل";
      case "DELIVERY": return "جاهز للتسليم والتحصيل";
      case "COMPLETED": return "مكتمل ومغلق";
      
      case "VEHICLE_CHECK_IN": return "استلام السيارة وكتابة الملاحظات";
      case "INSPECTION": return "تشخيص الأعطال والفحص";
      case "REPAIR": return "جاري العمل والإصلاح";
      case "QUALITY_CHECK": return "اختبار جودة السيارة";
      
      case "RAW_MATERIALS": return "طلب خامات المصنع";
      case "PRODUCTION_ORDER": return "تحضير أمر التشغيل";
      case "MANUFACTURING": return "جاري التشكيل والتصنيع";
      case "PACKAGING": return "تعبئة وفرز وتغليف";
      case "FINISHED_GOODS": return "المنتج تام في المستودع";
      
      case "QUALIFICATION": return "دراسة متطلبات العقد";
      case "PROPOSAL": return "عرض المقترح والتقدير";
      case "CONTRACT": return "توقيع العقد الرسمي";
      case "PROJECT_SETUP": return "بدء عمل الفريق وتأسيسه";
      case "BILLING": return "فوترة دفعات جارية";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LEAD":
      case "VEHICLE_CHECK_IN":
      case "RAW_MATERIALS":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "MEASUREMENT_VISIT":
      case "INSPECTION":
      case "QUALIFICATION":
      case "PRODUCTION_ORDER":
        return "bg-indigo-50 text-indigo-600 border-indigo-200";
      case "QUOTATION":
      case "PROPOSAL":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "APPROVAL":
      case "CONTRACT":
        return "bg-cyan-50 text-cyan-600 border-cyan-200";
      case "PRODUCTION":
      case "REPAIR":
      case "MANUFACTURING":
      case "PROJECT_SETUP":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "INSTALLATION":
      case "QUALITY_CHECK":
      case "PACKAGING":
      case "BILLING":
        return "bg-violet-50 text-violet-600 border-violet-200";
      case "DELIVERY":
      case "FINISHED_GOODS":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "COMPLETED":
        return "bg-teal-50 text-teal-600 border-teal-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const renderDashboardSecondaryBlock = () => {
    const currentType = tenantInfo?.industryType || regIndustryType;

    if (currentType === "FURNITURE") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Technicians & Measurements */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-1 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Calendar className="w-5.5 h-5.5 text-indigo-500" />
                <span>زيارات المقاسات القادمة</span>
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">زيارة فيلا الياسمين</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-bold">غداً 4م</span>
                </div>
                <p className="text-xs text-slate-500">الفني المسؤول: م. ناصر الشهراني</p>
                <p className="text-xs font-mono text-slate-400">العنوان: حي الياسمين مخرج 5</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">زيارة شقة السليمانية</span>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold">السبت 1م</span>
                </div>
                <p className="text-xs text-slate-500">الفني المسؤول: م. أحمد عبد الله</p>
                <p className="text-xs font-mono text-slate-400">العنوان: حي السليمانية شارع الضباب</p>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-indigo-50/50 rounded-2xl p-4 text-xs text-indigo-700 font-bold border border-indigo-100/50">
                💡 نصيحة النظام: تأكد من شحن أجهزة المتر الليزر والتقاط صور 3D للموقع لربطها بملف العميل الموحد.
              </div>
            </div>
          </div>

          {/* Projects Pipeline */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-2 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Briefcase className="w-5.5 h-5.5 text-indigo-500" />
                <span>إدارة وتتبع سير مشروعات الأثاث والتفصيل</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">اضغط على بطاقة المشروع لنقله للمرحلة التالية</span>
            </div>

            <div className="space-y-4">
              {projects.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => advanceProjectStatus(p.id)}
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md p-5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusColor(p.status)}`}>
                        {getStatusTextArabic(p.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      العميل: <span className="font-bold text-slate-700">{p.client}</span> | المقاسات: <span className="font-mono font-bold text-indigo-600">{p.measurements}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-bold italic">{p.notes}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-lg font-black text-slate-900 font-mono">{formatMoney(p.amount)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">المرحلة التالية ➔</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentType === "GARAGE") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Appointments */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-1 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Calendar className="w-5.5 h-5.5 text-indigo-500" />
                <span>حجوزات الصيانة لليوم</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">هوندا سيفيك 2020</span>
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-bold">04:30 م</span>
                </div>
                <p className="text-xs text-slate-500">العميل: ياسر الدوسري</p>
                <p className="text-xs text-slate-400 font-bold">الخدمة: تغيير فلاتر وزيوت</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">فورد إدج 2018</span>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold">05:15 م</span>
                </div>
                <p className="text-xs text-slate-500">العميل: فهد المطيري</p>
                <p className="text-xs text-slate-400 font-bold">الخدمة: فحص كهرباء ومكيف</p>
              </div>
            </div>
          </div>

          {/* Cars in service */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-2 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Wrench className="w-5.5 h-5.5 text-indigo-500" />
                <span>أوامر عمل ورشة صيانة السيارات الحية</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">اضغط على السيارة لتحديث مرحلة الإصلاح</span>
            </div>

            <div className="space-y-4">
              {appointments.map((a) => (
                <div 
                  key={a.id} 
                  onClick={() => advanceAppointmentStatus(a.id)}
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md p-5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{a.vehicle}</h4>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusColor(a.status)}`}>
                        {getStatusTextArabic(a.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      مستشار الخدمة: <span className="font-bold text-slate-700">{a.advisor}</span> | الفني الميكانيكي: <span className="font-bold text-indigo-600">{a.mechanic}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-bold">طلب الصيانة: {a.service}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-lg font-black text-slate-900 font-mono">{formatMoney(a.cost)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">تحديث المرحلة ➔</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentType === "FACTORY") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Machines Status */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-1 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Cpu className="w-5.5 h-5.5 text-indigo-500" />
                <span>حالة ماكينات صالة الإنتاج</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">خط الخياطة الدائرية A</p>
                  <p className="text-xs text-slate-400 mt-0.5">السرعة: 1200 دورة/دقيقة</p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                  يعمل بكفاءة
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">خط الكبس والتعبئة B</p>
                  <p className="text-xs text-slate-400 mt-0.5">المنتج: علب تغليف الكرتون</p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                  يعمل بكفاءة
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">ماكينة سحب البلاستيك C</p>
                  <p className="text-xs text-slate-400 mt-0.5">آخر صيانة: منذ أسبوعين</p>
                </div>
                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                  جاهز / خامل
                </span>
              </div>
            </div>
          </div>

          {/* Active Production Orders */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-2 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Layers className="w-5.5 h-5.5 text-indigo-500" />
                <span>أوامر تشغيل خطوط الإنتاج والـ BOM</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">اضغط لتحديث مرحلة التشغيل</span>
            </div>

            <div className="space-y-4">
              {productionOrders.map((po) => (
                <div 
                  key={po.id} 
                  onClick={() => advanceProductionStatus(po.id)}
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md p-5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{po.product}</h4>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusColor(po.status)}`}>
                        {getStatusTextArabic(po.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      مشرف الصالة: <span className="font-bold text-slate-700">{po.supervisor}</span> | خط الإنتاج: <span className="font-bold text-indigo-600">{po.machine}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-bold">الخامات المستهلكة: {po.rawMaterials}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-lg font-black text-slate-900 font-mono">{po.quantity.toLocaleString()} وحدة</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">تحديث المرحلة ➔</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentType === "SERVICE") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Meetings */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-1 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Calendar className="w-5.5 h-5.5 text-indigo-500" />
                <span>الاجتماعات والمقابلات القادمة</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">مراجعة الهوية البصرية</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-bold">اليوم 5م</span>
                </div>
                <p className="text-xs text-slate-500">العميل: شركة الشرفة للضيافة</p>
                <p className="text-xs text-slate-400 font-mono">المنصة: Google Meet</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">توقيع عقد متجر سلة</span>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold">غداً 11ص</span>
                </div>
                <p className="text-xs text-slate-500">العميل: مؤسسة الأناقة للأزياء</p>
                <p className="text-xs text-slate-400 font-mono">الموقع: مقر المنشأة الرئيسي</p>
              </div>
            </div>
          </div>

          {/* Active Projects Tasks */}
          <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-2 space-y-5 shadow-sm text-right">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
                <Briefcase className="w-5.5 h-5.5 text-indigo-500" />
                <span>فرص وقنوات مبيعات المشروعات الاستشارية</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">اضغط على المهمة لنقلها للمرحلة التالية</span>
            </div>

            <div className="space-y-4">
              {serviceTasks.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => advanceServiceTaskStatus(t.id)}
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md p-5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-violet-500"></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{t.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStatusColor(t.status)}`}>
                        {getStatusTextArabic(t.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      العميل: <span className="font-bold text-slate-700">{t.client}</span> | المسند إليه: <span className="font-bold text-indigo-600">{t.assignee}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-bold">تاريخ التسليم الأقصى: {t.deadline}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-lg font-black text-slate-900 font-mono">{formatMoney(t.budget)}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">المرحلة التالية ➔</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Default RETAIL
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* WAREHOUSE REGISTRY SUMMARY */}
        <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-1 space-y-5 shadow-sm text-right">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
              <Warehouse className="w-5.5 h-5.5 text-indigo-500" />
              <span>المستودعات والفروع</span>
            </h3>
            <button
              onClick={() => setShowAddWarehouse(true)}
              className="p-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl text-indigo-500 transition-all cursor-pointer"
              title="إضافة مستودع جديد"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {warehouses.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10 font-medium">لا توجد فروع مسجلة حالياً. أضف مستودعاً لتسجيل المخزون.</p>
          ) : (
            <div className="space-y-3">
              {warehouses.map((wh) => (
                <div key={wh.id} className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between hover:border-slate-200 transition-colors shadow-sm">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{wh.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{wh.address || "لم يتم تسجيل تفاصيل العنوان"}</p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">
                    نشط
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowAdjustStock(true)}
            className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-bold rounded-2xl transition-all cursor-pointer text-center block shadow-sm"
          >
            توريد وتسوية كميات المخزون
          </button>
        </div>

        {/* RECENT INVOICES CHECKOUT LOG */}
        <div className="bg-white border border-slate-200 p-6 rounded-[32px] lg:col-span-2 space-y-5 shadow-sm text-right">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
              <FileText className="w-5.5 h-5.5 text-indigo-500" />
              <span>آخر العمليات وفواتير المبيعات</span>
            </h3>
            <button
              onClick={() => setActiveTab("invoices")}
              className="text-sm font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              عرض السجل بالكامل
            </button>
          </div>

          {invoices.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16 font-medium">لا توجد مبيعات مسجلة حتى الآن.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-4 font-extrabold">رقم الفاتورة</th>
                    <th className="pb-4 font-extrabold">العميل</th>
                    <th className="pb-4 font-extrabold">طريقة السداد</th>
                    <th className="pb-4 font-extrabold text-left">المجموع الكلي</th>
                    <th className="pb-4 font-extrabold text-center">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 font-mono text-slate-900 font-extrabold text-sm">{inv.invoiceNumber}</td>
                      <td className="py-4.5 text-slate-800 font-semibold">{inv.customer?.name || "عميل نقدي عابر"}</td>
                      <td className="py-4.5 text-xs font-bold text-slate-500">
                        {inv.paymentMethod === "CARD" ? "مدى / بطاقة" : inv.paymentMethod === "CASH" ? "نقدي" : "تحويل بنكي"}
                      </td>
                      <td className="py-4.5 text-left font-black text-slate-900 font-mono text-base">{formatMoney(inv.grandTotal)}</td>
                      <td className="py-4.5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          inv.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {inv.status === "PAID" ? "مدفوعة" : "مسودة"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- RENDER COMPONENT ---
  if (!token) {
    // ONBOARDING & LOGIN SCREEN (LIGHT THEME)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-16 px-6 sm:px-8 lg:px-12 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Abstract shapes for premium light mode visual background */}
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-50/70 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-50/70 blur-[130px] pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center">
          <div className="flex justify-center items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
              أنتي غرافيتي ERP
            </span>
          </div>
          <p className="mt-4 text-slate-500 text-base font-bold">
            {authMode === "login" ? "سجل الدخول لإدارة منشأتك وعملياتك" : "سجل حسابك لتأسيس نظام إدارة وتخطيط متكامل لشركتك"}
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
          <div className="bg-white border border-slate-200/80 py-10 px-8 sm:px-12 shadow-xl shadow-slate-100 rounded-[32px] transition-all duration-300">
            {errorMsg && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 p-4.5 rounded-2xl flex items-start gap-3 text-base text-right font-medium animate-pulse">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 p-4.5 rounded-2xl flex items-start gap-3 text-base text-right font-medium">
                <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === "login" ? (
              <form className="space-y-6 text-right" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-right">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-right">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                    placeholder="••••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-4 flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {authLoading ? <Loader className="w-6 h-6 animate-spin" /> : "تسجيل الدخول للمنظومة"}
                </button>
              </form>
            ) : (
              /* MULTI-STEP ONBOARDING WIZARD */
              <div className="space-y-6">
                {/* Steps visual indicators */}
                <div className="flex items-center justify-between max-w-md mx-auto mb-8 dir-ltr">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>1</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">الحساب</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${regStep >= 2 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>2</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">التفعيل</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${regStep >= 3 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 3 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>3</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">البيانات</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${regStep >= 4 ? "bg-indigo-600" : "bg-slate-200"}`}></div>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${regStep >= 4 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>4</div>
                    <span className="text-xs font-bold text-slate-500 mt-2">التهيئة</span>
                  </div>
                </div>

                {/* Step 1: Email and Password Form */}
                {regStep === 1 && (
                  <form
                    className="space-y-6 text-right"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const code = Math.floor(100000 + Math.random() * 900000).toString();
                      setVerificationCode(code);
                      setUserEnteredCode("");
                      setCodeError(null);
                      setRegStep(2);
                    }}
                  >
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                        placeholder="name@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور (12 خانة على الأقل)</label>
                      <input
                        type="password"
                        required
                        minLength={12}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 text-base transition-all focus:outline-none text-right font-medium"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-4 flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      التالي
                    </button>
                  </form>
                )}

                {/* Step 2: Email Verification Notice */}
                {regStep === 2 && (
                  <div className="text-center space-y-6 py-4">
                    {/* Simulated Inbox Banner */}
                    <div className="bg-indigo-50/80 border border-indigo-100/80 rounded-2xl p-5 text-right flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>صندوق الوارد (البريد الإلكتروني التجريبي)</span>
                      </div>
                      <p className="text-slate-600 text-xs font-bold leading-relaxed">
                        مرحباً! لتسريع تجربتك وتخطي تأخير وصول الرسائل الإلكترونية، قمنا بتوليد رمز التفعيل لبريدك الخاص <span className="font-mono text-indigo-600">{regEmail}</span> مباشرة أدناه:
                      </p>
                      <div className="mt-2 flex items-center justify-between bg-white border border-indigo-150 rounded-xl px-4 py-2.5 shadow-inner">
                        <span className="text-slate-500 font-bold text-xs">رمز تفعيل الحساب:</span>
                        <span className="text-2xl font-black text-indigo-600 tracking-widest font-mono select-all">{verificationCode}</span>
                      </div>
                    </div>

                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-8 h-8 animate-pulse" />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900">تأكيد الحساب والبريد الإلكتروني</h3>
                    
                    <div className="text-right max-w-sm mx-auto space-y-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">أدخل رمز التفعيل المكون من 6 أرقام</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={userEnteredCode}
                        onChange={(e) => {
                          setUserEnteredCode(e.target.value);
                          setCodeError(null);
                        }}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-center tracking-widest text-xl font-black font-mono text-slate-800 focus:outline-none transition-all"
                        placeholder="000000"
                      />
                      {codeError && (
                        <p className="text-rose-500 text-xs font-bold mt-1 text-center animate-bounce">{codeError}</p>
                      )}
                    </div>

                    <div className="flex gap-4 max-w-sm mx-auto pt-4">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                      >
                        رجوع
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (userEnteredCode.trim() === verificationCode) {
                            setRegStep(3);
                          } else {
                            setCodeError("رمز التفعيل غير صحيح، يرجى المحاولة مرة أخرى.");
                          }
                        }}
                        className="flex-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
                      >
                        تحقق ومتابعة
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Business Setup Form */}
                {regStep === 3 && (
                  <form className="space-y-5 text-right" onSubmit={(e) => { e.preventDefault(); setRegStep(4); }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الأول</label>
                        <input
                          type="text"
                          required
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none text-right font-medium"
                          placeholder="أحمد"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم العائلة</label>
                        <input
                          type="text"
                          required
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none text-right font-medium"
                          placeholder="علي"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم البيزنيس (اسم منشأتك الخاص)</label>
                      <p className="text-xs text-slate-400 mb-2">هذا هو الاسم الذي سيظهر في لوحة التحكم والفواتير وإيصالات المبيعات الخاصة بك.</p>
                      <input
                        type="text"
                        required
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none text-right font-medium"
                        placeholder="بيزنيس الباز للمبيعات"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">مجال العمل / النشاط</label>
                        <select
                          value={regIndustryType}
                          onChange={(e) => setRegIndustryType(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-3 py-3.5 text-slate-800 text-sm transition-all focus:outline-none font-bold"
                        >
                          <option value="RETAIL">إدارة محلات التجزئة والمستودعات</option>
                          <option value="FURNITURE">تفصيل وتصنيع الأثاث والمطابخ</option>
                          <option value="GARAGE">ورش ومراكز صيانة السيارات</option>
                          <option value="FACTORY">المصانع وإدارة خطوط الإنتاج</option>
                          <option value="SERVICE">الشركات الخدمية والاستشارات والمقاولات</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">النطاق الفرعي (رابط الدخول)</label>
                        <input
                          type="text"
                          required
                          value={regSubdomain}
                          onChange={(e) => setRegSubdomain(e.target.value)}
                          className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3.5 text-slate-800 text-sm transition-all focus:outline-none font-mono text-left font-bold"
                          placeholder="al-baz"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">باقة الاشتراك</label>
                      <select
                        value={regPlanName}
                        onChange={(e) => setRegPlanName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-3 py-3.5 text-slate-800 text-sm transition-all focus:outline-none font-bold"
                      >
                        <option value="BUSINESS">خطة الأعمال الاحترافية (موصى بها)</option>
                        <option value="STARTER">الخطة الأساسية الفردية</option>
                        <option value="PROFESSIONAL">خطة المؤسسات والشركات الكبرى</option>
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                      >
                        رجوع
                      </button>
                      <button
                        type="submit"
                        className="flex-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg transition-all cursor-pointer"
                      >
                        إنشاء النظام والبدء
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 4: System Provisioning Animation Screen */}
                {regStep === 4 && (
                  <div className="text-center space-y-8 py-10">
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      {/* Animated outer ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-violet-100 border-b-violet-500 animate-spin animate-duration-1000"></div>
                      <Building className="w-10 h-10 text-indigo-600 relative z-10" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900">جاري إعداد نظامك السحابي الخاص</h3>
                      <p className="text-slate-600 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                        يرجى الانتظار للحظات بينما ننشئ مساحة العمل الآمنة لقاعدة بيانات Supabase ونثبّت إعدادات التكوين المخصصة لشركتك.
                      </p>
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-300" style={{ width: `${provisioningProgress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-bold font-mono">
                        <span>{provisioningProgress}%</span>
                        <span>{provisioningMsg}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setRegStep(1);
                  setErrorMsg(null);
                }}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {authMode === "login" ? "ليس لديك مساحة عمل؟ أنشئ حساباً الآن" : "لديك حساب للمنشأة؟ سجل الدخول هنا"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD SCREEN (LIGHT THEME) ---
  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden" dir="rtl">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-100/5 blur-[130px] pointer-events-none"></div>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 h-full shrink-0">
        <div className="p-6 pb-2 text-right">
          <div className="flex items-center gap-3 bg-slate-850 p-3.5 rounded-2xl mb-6 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Building className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-white text-sm truncate" title={tenantInfo?.businessName || regBusinessName}>
                {tenantInfo?.businessName || regBusinessName || "مساحة العمل"}
              </span>
              <span className="text-[10px] text-slate-400 truncate mt-0.5">لوحة الإدارة</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto text-right">
          {/* Dashboard Button */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>الرئيسية والإحصاءات</span>
          </button>
          
          {/* Customers Button */}
          {(isModuleEnabled("customers") || isModuleEnabled("crm")) && (
            <button
              onClick={() => setActiveTab("customers")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "customers"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>إدارة العملاء (CRM)</span>
            </button>
          )}

          {/* Products/Materials Button */}
          {(isModuleEnabled("products") || isModuleEnabled("materials") || isModuleEnabled("inventory")) && (
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "products"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Package className="w-5 h-5 shrink-0" />
              <span>{getProductsLabel()}</span>
            </button>
          )}

          {/* POS Button */}
          {isModuleEnabled("pos") && (
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "pos"
                  ? "bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20"
                  : "text-emerald-450 hover:bg-slate-800 hover:text-emerald-300"
              }`}
            >
              <ShoppingCart className="w-5 h-5 shrink-0" />
              <span>فاتورة الكاشير (POS)</span>
            </button>
          )}
          
          {/* Projects Button */}
          {isModuleEnabled("projects") && (
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Briefcase className="w-5 h-5 shrink-0" />
              <span>
                {(tenantInfo?.industryType || regIndustryType) === "FURNITURE" ? "تفصيل ومقاسات المشاريع" : "إدارة المشاريع والمهام"}
              </span>
            </button>
          )}

          {/* Workshop Button */}
          {(isModuleEnabled("vehicles") || isModuleEnabled("appointments")) && (
            <button
              onClick={() => setActiveTab("workshop")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "workshop"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Wrench className="w-5 h-5 shrink-0" />
              <span>ورشة استقبال وصيانة السيارات</span>
            </button>
          )}

          {/* Factory Button */}
          {isModuleEnabled("production") && (tenantInfo?.industryType || regIndustryType) === "FACTORY" && (
            <button
              onClick={() => setActiveTab("factory")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "factory"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Cpu className="w-5 h-5 shrink-0" />
              <span>خطوط الإنتاج والتصنيع</span>
            </button>
          )}

          {/* Invoices Button */}
          {(isModuleEnabled("sales") || isModuleEnabled("finance") || isModuleEnabled("invoices")) && (
            <button
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "invoices"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5 shrink-0" />
              <span>سجل الفواتير الصادرة</span>
            </button>
          )}

          {/* Expenses Button */}
          {(isModuleEnabled("finance") || isModuleEnabled("expenses")) && (
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-indigo-650 text-white font-bold shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <DollarSign className="w-5 h-5 shrink-0" />
              <span>المصروفات والخزينة</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer with Sync, Settings, Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={fetchAllData}
              disabled={dataLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700/60 active:scale-[0.98] disabled:opacity-50"
              title="مزامنة البيانات مع السيرفر"
            >
              {dataLoading ? <Loader className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <Warehouse className="w-3.5 h-3.5 text-indigo-400" />}
              <span>تحديث</span>
            </button>
            
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700/60 transition-all cursor-pointer active:scale-[0.98]"
              title="إعدادات المنشأة"
            >
              <Settings className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-black/20 hover:text-red-300 rounded-xl transition text-sm font-bold justify-center cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5 animate-pulse" />
            <span>خروج من الإدارة</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 relative">
        <main className="p-6 md:p-8 relative">
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 p-5 rounded-3xl flex items-start gap-4 text-base relative animate-pulse text-right shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">فشل الإجراء: </span>
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-700 p-5 rounded-3xl flex items-start gap-4 text-base text-right shadow-sm">
              <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">نجاح العملية: </span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* LOADING STATE COVER */}
          {dataLoading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 text-base font-bold">جاري جلب ومزامنة بيانات المنشأة مع قاعدة Supabase...</p>
            </div>
          )}

          {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Dashboard Title & Subtitle */}
              <div className="flex justify-between items-end mb-4 text-right">
                <div>
                  <h1 className="text-3xl font-black text-slate-800">نظرة عامة</h1>
                  <p className="text-slate-500 mt-2">إحصائيات المبيعات والأداء</p>
                </div>
              </div>

              {/* METRIC CARD GRID */}
              {renderDashboardMetrics()}

              {/* SECONDARY INFO BLOCK: WAREHOUSES & RECENT ACTIVITY */}
              {renderDashboardSecondaryBlock()}
            </div>
          )}

          {/* TAB CONTENT: 2. CRM CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">دليل عملاء المنشأة (CRM)</h2>
                  <p className="text-sm text-slate-500 mt-1">تتبع وتسجيل حسابات العملاء، الأرصدة المستحقة، وحدود الائتمان المسموحة</p>
                </div>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>تسجيل عميل جديد</span>
                </button>
              </div>

              {/* CUSTOMERS LISTING TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {customers.length === 0 ? (
                  <p className="text-base text-slate-400 text-center py-24 font-bold">لا يوجد عملاء مسجلين حالياً. اضغط على "تسجيل عميل جديد" للبدء.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4.5 font-extrabold">الاسم والملف التعريفى</th>
                          <th className="px-6 py-4.5 font-extrabold">معلومات الاتصال</th>
                          <th className="px-6 py-4.5 font-extrabold">الرقم الضريبي</th>
                          <th className="px-6 py-4.5 font-extrabold">الحد الائتماني</th>
                          <th className="px-6 py-4.5 font-extrabold">الرصيد المستحق</th>
                          <th className="px-6 py-4.5 font-extrabold">تاريخ التسجيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5">
                              <span className="font-extrabold text-slate-900 text-base block">{cust.name}</span>
                              <span className="text-xs text-slate-400 font-mono block mt-1">{cust.id}</span>
                            </td>
                            <td className="px-6 py-4.5 space-y-1">
                              <span className="block text-slate-800 font-medium">{cust.email || "لم يسجل بريد"}</span>
                              <span className="block text-slate-500 text-xs font-mono">{cust.phone || "بدون رقم جوال"}</span>
                            </td>
                            <td className="px-6 py-4.5 font-mono text-slate-700 font-medium">{cust.taxNumber || "—"}</td>
                            <td className="px-6 py-4.5 font-extrabold text-slate-900 font-mono text-base">{formatMoney(cust.creditLimit)}</td>
                            <td className="px-6 py-4.5">
                              <span className={`font-black font-mono text-base ${Number(cust.outstandingBalance) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                ${Number(cust.outstandingBalance).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-slate-600 font-medium">
                              {new Date(cust.createdAt).toLocaleDateString("ar-SA")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. PRODUCT CATALOG */}
          {activeTab === "products" && (
            <div className="space-y-6 text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">دليل المنتجات والمستودع</h2>
                  <p className="text-sm text-slate-500 mt-1">عرض وتصنيف السلع المتوفرة، تكلفة الشراء، أسعار البيع وتتبع الباركود (UPC)</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowSuppliersModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Users className="w-4.5 h-4.5 text-slate-500" />
                    <span>إدارة الموردين</span>
                  </button>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <PlusCircle className="w-4.5 h-4.5 text-emerald-600" />
                    <span>تسجيل توريد مخزني</span>
                  </button>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <PlusCircle className="w-4.5 h-4.5" />
                    <span>إضافة منتج جديد</span>
                  </button>
                </div>
              </div>

              {/* PRODUCTS LISTING */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {products.length === 0 ? (
                  <p className="text-base text-slate-400 text-center py-24 lg:col-span-2 font-bold">دليل المنتجات خالي حالياً. يرجى تسجيل أول منتج للمنشأة.</p>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-5 hover:border-slate-300 hover:shadow-md transition-all duration-300 text-right">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                            {p.brand || "بدون علامة تجارية"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">الرمز التعريفى: {p.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 mt-3">{p.name}</h3>
                        <p className="text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">{p.description || "لم يسجل وصف تفصيلي للمنتج."}</p>
                      </div>

                      {/* Variants and stock listing */}
                      <div className="border-t border-slate-100 pt-4.5 space-y-3.5 text-right">
                        <h4 className="text-sm font-extrabold text-slate-800">أكواد وأصناف المنتجات المسجلة (SKUs):</h4>
                        {p.variants?.map((v: any) => (
                          <div key={v.id} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col text-sm gap-3 text-right">
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-1.5 text-right">
                                <p className="font-mono font-black text-indigo-600 text-right text-base">{v.sku}</p>
                                {v.barcode && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono justify-start font-medium">
                                    <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>{v.barcode}</span>
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 text-right font-medium">
                                  {Object.keys(v.attributes || {}).map((k) => `${k}: ${v.attributes[k]}`).join(" | ") || "بدون خصائص إضافية"}
                                </p>
                              </div>

                              <div className="text-left shrink-0 space-y-1">
                                <p className="font-black text-slate-900 font-mono text-base">{formatMoney(v.price)}</p>
                                <p className="text-xs text-slate-500 font-mono font-bold">التكلفة: ${Number(v.costPrice).toFixed(2)}</p>
                                <div className="mt-2 flex justify-end flex-wrap gap-1">
                                  {v.balances && v.balances.length > 0 ? (
                                    v.balances.map((bal: any) => (
                                      <span key={bal.id} className="inline-block text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg ms-1">
                                        {bal.warehouse?.name || "المستودع"}: {Number(bal.quantity)} وحدة
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs font-bold bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg">
                                      نفذت الكمية
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* BOM Section */}
                            {(() => {
                              const variantBom = boms.find((b: any) => b.variantId === v.id);
                              return variantBom ? (
                                <div className="mt-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-right text-xs">
                                  <p className="font-extrabold text-indigo-850 flex items-center gap-1 justify-end">
                                    <span>مكونات الإنتاج (BOM)</span>
                                    <Scale className="w-3.5 h-3.5" />
                                  </p>
                                  <div className="mt-1.5 space-y-1">
                                    {variantBom.items?.map((item: any) => (
                                      <div key={item.id} className="flex justify-between text-slate-600">
                                        <span className="font-mono text-left">${(Number(item.unitCost) * Number(item.quantity)).toFixed(2)}</span>
                                        <span>{Number(item.quantity)}x {item.variant?.product?.name || "مادة خام"}</span>
                                      </div>
                                    ))}
                                    <div className="border-t border-indigo-100 pt-1.5 mt-1.5 flex justify-between font-black text-indigo-900">
                                      <span className="font-mono">${Number(variantBom.unitCostRollup || 0).toFixed(2)}</span>
                                      <span>تكلفة المواد التراكمية:</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const rawOptions = products.filter(pr => pr.id !== p.id).map(pr => pr.variants?.[0]).filter(Boolean);
                                    if (rawOptions.length < 2) {
                                      alert("يرجى إضافة المزيد من المنتجات الخام أولاً لاستخدامها كمكونات.");
                                      return;
                                    }
                                    const mockItems = [
                                      { variantId: rawOptions[0].id, quantity: 2, unitCost: Number(rawOptions[0].price) * 0.5 },
                                      { variantId: rawOptions[1].id, quantity: 1, unitCost: Number(rawOptions[1].price) * 0.4 }
                                    ];
                                    handleCreateBOM(v.id, `تركيبة ${p.name}`, mockItems);
                                  }}
                                  className="mt-2 text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-650 text-slate-605 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors w-full text-center"
                                >
                                  + تحديد شجرة مكونات الإنتاج (BOM) وحساب التكلفة
                                </button>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. POS CASHIER CHECKOUT */}
          {activeTab === "pos" && (
            <div className="relative min-h-[600px] w-full">
              {/* SHIFT WARNING OVERLAY */}
              {!activeShift && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-amber-500 animate-pulse" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="text-2xl font-black text-white">درج الكاشير مغلق!</h3>
                    <p className="text-slate-350 text-sm font-medium">
                      للوقاية من العجز والسرقات ومطابقة النقدية، يمنع النظام بدء عمليات البيع والتحصيل قبل فتح وردية محاسبة جديدة وتوثيق عهدة الرصيد الافتتاحي.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOpenShiftModal(true)}
                    className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-955 font-extrabold rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    فتح وردية جديدة وتوثيق العهدة
                  </button>
                </div>
              )}

              <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 text-right ${!activeShift ? "pointer-events-none filter blur-[2px]" : ""}`}>
                {/* RIGHT COLUMN: PRODUCTS BROWSER (3/5 width) - Rendered first in Arabic RTL flow */}
                <div className="lg:col-span-3 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                        <ShoppingCart className="w-6 h-6 text-emerald-500" />
                        <span>شاشة المحاسبة المباشرة (POS)</span>
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">اختر أصناف المنتجات المتوفرة لتسجيل عملية بيع فوري وإصدار إيصال</p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {activeShift && (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-250 px-4 py-2 rounded-xl text-emerald-800 text-xs font-black">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                          <span>الوردية مفتوحة بواسطة {activeShift.user?.firstName || "المحاسب"} | عهدة: {formatMoney(activeShift.openingBalance)}</span>
                          <button
                            onClick={() => {
                              setShiftActualCash("0");
                              setShiftNotes("");
                              setShowCloseShiftModal(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            إغلاق الوردية وتسوية الدرج
                          </button>
                        </div>
                      )}
                      <select
                        value={posWarehouseId}
                        onChange={(e) => setPosWarehouseId(e.target.value)}
                        className="bg-white border border-slate-300 text-sm rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-sm text-right"
                      >
                        <option value="">اختر مستودع السحب...</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                {/* SEARCH PRODUCTS */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={posSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setPosSearchQuery(query);
                      
                      // Check for exact barcode or SKU match
                      if (query.trim()) {
                        const trimmed = query.trim().toLowerCase();
                        for (const p of products) {
                          if (p.variants) {
                            for (const v of p.variants) {
                              const stockBal = v.balances?.find((b: any) => b.warehouseId === posWarehouseId)?.quantity || 0;
                              if (Number(stockBal) > 0) {
                                const skuMatch = v.sku && v.sku.toLowerCase() === trimmed;
                                const barcodeMatch = v.barcode && v.barcode.toLowerCase() === trimmed;
                                if (skuMatch || barcodeMatch) {
                                  addToCart(p, v);
                                  setPosSearchQuery("");
                                  showTemporarySuccess(`تمت إضافة ${p.name} تلقائياً للسلة!`);
                                  return;
                                }
                              }
                            }
                          }
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-2xl pr-12 pl-4 py-4 text-base text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder-slate-450 text-right font-medium"
                    placeholder="ابحث باسم السلعة، رقم الكود المخزني (SKU) أو الباركود..."
                  />
                </div>

                {/* PRODUCTS LIST */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
                      p.variants?.some((v: any) => v.sku.toLowerCase().includes(posSearchQuery.toLowerCase()))
                    )
                    .map((p) =>
                      p.variants?.map((v: any) => {
                        const stockBal = v.balances?.find((b: any) => b.warehouseId === posWarehouseId)?.quantity || 0;
                        return (
                          <div
                            key={v.id}
                            onClick={() => Number(stockBal) > 0 && addToCart(p, v)}
                            className={`bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-md transition-all duration-200 group text-right shadow-sm ${
                              Number(stockBal) > 0 ? "cursor-pointer" : "opacity-45 cursor-not-allowed"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">{p.brand || "عام"}</span>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                                  Number(stockBal) > 0 ? "bg-emerald-550 text-white" : "bg-rose-50 text-rose-600"
                                }`}>
                                  {Number(stockBal) > 0 ? `المتوفر: ${Number(stockBal)}` : "غير متوفر"}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-800 mt-3 group-hover:text-emerald-600 transition-colors leading-snug">{p.name}</h4>
                              <p className="text-xs text-slate-500 font-mono mt-1 text-right font-medium">SKU: {v.sku}</p>
                            </div>
                            <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
                              <span className="font-black text-base text-emerald-600 font-mono">{formatMoney(v.price)}</span>
                              {Number(stockBal) > 0 && (
                                <span className="text-xs text-emerald-650 font-extrabold flex items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
                                  إضافة للسلة
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                </div>
              </div>

              {/* LEFT COLUMN: POS CHECKOUT CART (2/5 width) - Rendered on the left side */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 flex flex-col min-h-[620px] justify-between shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-4 flex items-center justify-between">
                      <span>سلة المشتريات الحالية</span>
                      <span className="text-sm text-slate-500 font-bold">({posCart.length}) منتجات</span>
                    </h3>

                    {/* SELECT CUSTOMER */}
                    <div className="space-y-3 mt-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ربط المعاملة بعميل مسجل (اختياري)</label>
                        <select
                          value={posCustomerId}
                          onChange={(e) => setPosCustomerId(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-sm rounded-xl px-3.5 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                        >
                          <option value="">عميل نقدي عابر (افتراضي)</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} (رصيد مستحق: {formatMoney(c.outstandingBalance)})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* CART LISTING */}
                    {posCart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-sm space-y-3">
                        <ShoppingCart className="w-12 h-12 text-slate-300 animate-bounce" />
                        <p className="font-bold">السلة فارغة حالياً. اضغط على المنتجات المتوفرة لإضافتها.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-5 max-h-[260px] overflow-y-auto pr-1">
                        {posCart.map((item) => (
                          <div key={item.variantId} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-right">
                            <div className="min-w-0 text-right flex-1">
                              <p className="font-extrabold text-slate-800 text-sm truncate text-right">{item.productName}</p>
                              <p className="font-mono text-xs text-indigo-650 mt-1 text-right font-bold">{item.sku}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-black text-sm cursor-pointer text-slate-700 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-black font-mono text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-black text-sm cursor-pointer text-slate-700 transition-colors"
                              >
                                +
                              </button>
                              <span className="font-black text-slate-900 text-sm ms-3 font-mono">{formatMoney(item.unitPrice * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CHECKOUT TOTALS & BUTTON */}
                  <div className="border-t border-slate-100 pt-5 mt-5 space-y-4 text-right">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>المجموع الفرعي (قبل الضريبة)</span>
                        <span className="font-bold font-mono text-slate-800">{formatMoney(calculateCartSubtotal())}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>ضريبة القيمة المضافة (15.00% VAT)</span>
                        <span className="font-bold font-mono text-slate-800">{formatMoney(calculateCartTax())}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-extrabold text-base pt-3 border-t border-slate-100">
                        <span>المجموع النهائي الإجمالي</span>
                        <span className="text-emerald-600 font-black font-mono text-lg">{formatMoney(calculateCartTotal())}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">طريقة السداد</label>
                        <select
                          value={posPaymentMethod}
                          onChange={(e) => setPosPaymentMethod(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-3 focus:outline-none text-slate-800 focus:border-indigo-500 font-bold cursor-pointer"
                        >
                          <option value="CARD">بطاقة مدى / ائتمان</option>
                          <option value="CASH">دفع نقدي</option>
                          <option value="TRANSFER">تحويل بنكي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">المبلغ المدفوع ($)</label>
                        <input
                          type="text"
                          value={posAmountPaid}
                          onChange={(e) => setPosAmountPaid(e.target.value)}
                          className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-3 focus:outline-none text-slate-800 focus:border-indigo-500 text-left font-mono font-bold"
                          placeholder={`${calculateCartTotal().toFixed(2)}`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePOSCheckout}
                      className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl text-sm tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer text-center"
                    >
                      إعتماد وإصدار إيصال الفاتورة المبسطة
                    </button>
                  </div>
                </div>

                {/* PRINT INVOICE RECEIPT OVERLAY */}
                {posCheckoutSuccess && (
                  <div className="bg-white border border-emerald-500/30 p-6 rounded-[32px] space-y-4 shadow-xl text-right">
                    <div className="flex items-center gap-2 text-emerald-650 justify-end">
                      <CheckCircle className="w-6 h-6" />
                      <h4 className="font-extrabold text-sm md:text-base">تم حفظ الفاتورة وإتمام المعاملة بنجاح!</h4>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl font-mono text-xs space-y-2.5 border border-slate-200 text-right shadow-inner">
                      <p className="text-center font-bold text-sm text-slate-800">إيصال مبيعات مبسط</p>
                      <p className="text-center text-slate-500 font-mono mt-1">الفاتورة: {posCheckoutSuccess.invoiceNumber}</p>
                      <p className="text-center text-slate-400 font-mono">التاريخ: {new Date(posCheckoutSuccess.createdAt).toLocaleString("ar-SA")}</p>
                      <div className="border-t border-dashed border-slate-300 my-3"></div>
                      {posCheckoutSuccess.items?.map((it: any) => (
                        <div key={it.id} className="flex justify-between text-slate-700 font-sans text-right text-sm">
                          <span className="font-mono text-left font-bold">${(Number(it.unitPrice) * Number(it.quantity)).toFixed(2)}</span>
                          <span>{it.quantity}x {it.variant?.sku || "صنف منتج"}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-slate-300 my-3"></div>
                      <div className="flex justify-between text-slate-900 font-black text-sm">
                        <span className="font-mono text-left">${Number(posCheckoutSuccess.grandTotal).toFixed(2)}</span>
                        <span>المجموع (شامل الضريبة)</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span className="font-mono text-left">${Number(posCheckoutSuccess.amountPaid).toFixed(2)}</span>
                        <span>المبلغ المدفوع</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPosCheckoutSuccess(null)}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-250 text-slate-700 text-sm font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      إغلاق إيصال العرض
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* TAB CONTENT: 5. SALES INVOICES */}
          {activeTab === "invoices" && (
            <div className="space-y-5 text-right">
              <div>
                <h2 className="text-2xl font-black text-slate-900">سجل فواتير المبيعات الصادرة</h2>
                <p className="text-sm text-slate-500 mt-1">مراجعة وتتبع جميع الفواتير الصادرة للعملاء وتاريخ السداد الخاص بكل عملية</p>
              </div>

              {/* INVOICES TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {invoices.length === 0 ? (
                  <p className="text-base text-slate-400 text-center py-24 font-bold">لا توجد فواتير مبيعات مسجلة حتى الآن.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4.5 font-extrabold">رقم الفاتورة والتاريخ</th>
                          <th className="px-6 py-4.5 font-extrabold">العميل المرتبط</th>
                          <th className="px-6 py-4.5 font-extrabold">طريقة الدفع</th>
                          <th className="px-6 py-4.5 font-extrabold text-left">قيمة الضريبة (15%)</th>
                          <th className="px-6 py-4.5 font-extrabold text-left">المجموع الكلي</th>
                          <th className="px-6 py-4.5 font-extrabold text-center">حالة السداد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5">
                              <span className="font-mono font-black text-slate-900 block text-base">{inv.invoiceNumber}</span>
                              <span className="text-xs text-slate-500 block mt-1 font-mono">
                                {new Date(inv.createdAt).toLocaleString("ar-SA")}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-800 font-extrabold">
                              {inv.customer?.name || "عميل نقدي عابر"}
                            </td>
                            <td className="px-6 py-3.5 text-slate-600 font-bold">
                              {inv.paymentMethod === "CARD" ? "مدى / بطاقة" : inv.paymentMethod === "CASH" ? "نقدي" : "تحويل بنكي"}
                            </td>
                            <td className="px-6 py-3.5 text-left font-mono text-slate-700 font-bold">${Number(inv.taxTotal).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-left font-black text-slate-900 text-base font-mono">${Number(inv.grandTotal).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                inv.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              }`}>
                                {inv.status === "PAID" ? "مدفوعة ومسواة" : "غير مدفوعة"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: PROJECTS (FURNITURE & SERVICE) */}
          {activeTab === "projects" && (
            <div className="space-y-6 text-right animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {(tenantInfo?.industryType || regIndustryType) === "FURNITURE" ? "إدارة وتفصيل مشروعات العملاء" : "إدارة المشاريع والمهام الاستشارية"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {(tenantInfo?.industryType || regIndustryType) === "FURNITURE" 
                      ? "متابعة المقاسات وعروض الأسعار وحالات التصنيع والتركيب للأثاث والديكور" 
                      : "تنظيم مهام الفرق الفنية، تتبع عقود العملاء والفوترة ومراحل التسليم"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProject(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>
                    {(tenantInfo?.industryType || regIndustryType) === "FURNITURE" ? "تسجيل مشروع / طلب تفصيل جديد" : "إنشاء مشروع / مهمة جديدة"}
                  </span>
                </button>
              </div>

              {/* Kanban-like grid view of projects by workflow state */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Column 1: Leads / Preparation */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">تواصل جديد ومقاسات</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {projects.filter(p => p.status === "LEAD" || p.status === "MEASUREMENT_VISIT").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {projects.filter(p => p.status === "LEAD" || p.status === "MEASUREMENT_VISIT").map(p => (
                      <div key={p.id} onClick={() => { setSelectedProjectIdForMaterials(p.id); fetchProjectMaterials(p.id); fetchMeasurementHistory(p.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{p.name}</p>
                        <p className="text-slate-500">العميل: {p.client}</p>
                        {p.measurements && <p className="text-indigo-600 font-mono">المقاس: {p.measurements}</p>}
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(p.amount)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Quotation & Design */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">التسعير والتصاميم</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {projects.filter(p => p.status === "QUOTATION" || p.status === "APPROVAL").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {projects.filter(p => p.status === "QUOTATION" || p.status === "APPROVAL").map(p => (
                      <div key={p.id} onClick={() => { setSelectedProjectIdForMaterials(p.id); fetchProjectMaterials(p.id); fetchMeasurementHistory(p.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{p.name}</p>
                        <p className="text-slate-500">العميل: {p.client}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(p.amount)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Factory / Production */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">جاري التصنيع بالورشة</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {projects.filter(p => p.status === "PRODUCTION").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {projects.filter(p => p.status === "PRODUCTION").map(p => (
                      <div key={p.id} onClick={() => { setSelectedProjectIdForMaterials(p.id); fetchProjectMaterials(p.id); fetchMeasurementHistory(p.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{p.name}</p>
                        <p className="text-slate-500">العميل: {p.client}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(p.amount)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 4: Installation & Delivery */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">التركيب والتسليم النهائي</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {projects.filter(p => p.status === "INSTALLATION" || p.status === "DELIVERY" || p.status === "COMPLETED").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {projects.filter(p => p.status === "INSTALLATION" || p.status === "DELIVERY" || p.status === "COMPLETED").map(p => (
                      <div key={p.id} onClick={() => { setSelectedProjectIdForMaterials(p.id); fetchProjectMaterials(p.id); fetchMeasurementHistory(p.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{p.name}</p>
                        <p className="text-slate-500">العميل: {p.client}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(p.amount)}</span>
                          <span className="text-xs text-emerald-600 font-bold">{p.status === "COMPLETED" ? "مكتمل ✓" : "متابعة التسليم ➔"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: WORKSHOP (GARAGE) */}
          {activeTab === "workshop" && (
            <div className="space-y-6 text-right animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">صالة استقبال وأوامر عمل صيانة السيارات</h2>
                  <p className="text-sm text-slate-500 mt-1">تتبع دورة صيانة المركبة بدءاً من الفحص وتقدير قطع الغيار إلى الإصلاح وتسليم العميل</p>
                </div>
                <button
                  onClick={() => setShowAddAppointment(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>استقبال مركبة جديدة للورشة</span>
                </button>
              </div>

              {/* Kanban-like grid view of appointments */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Column 1: Check-in / Inspection */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">الاستقبال والفحص</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {appointments.filter(a => a.status === "VEHICLE_CHECK_IN" || a.status === "INSPECTION").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {appointments.filter(a => a.status === "VEHICLE_CHECK_IN" || a.status === "INSPECTION").map(a => (
                      <div key={a.id} onClick={() => { setSelectedProjectIdForMaterials(a.id); fetchProjectMaterials(a.id); fetchMeasurementHistory(a.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{a.vehicle}</p>
                        <p className="text-slate-500">الخدمة: {a.service}</p>
                        <p className="text-slate-400">الفني: {a.mechanic}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(a.cost)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Quotation & Approval */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">تقدير التكلفة والموافقة</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {appointments.filter(a => a.status === "QUOTATION" || a.status === "APPROVAL").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {appointments.filter(a => a.status === "QUOTATION" || a.status === "APPROVAL").map(a => (
                      <div key={a.id} onClick={() => { setSelectedProjectIdForMaterials(a.id); fetchProjectMaterials(a.id); fetchMeasurementHistory(a.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{a.vehicle}</p>
                        <p className="text-slate-500">الخدمة: {a.service}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(a.cost)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Repair & Quality Check */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">ورشة الصيانة الجارية</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {appointments.filter(a => a.status === "REPAIR" || a.status === "QUALITY_CHECK").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {appointments.filter(a => a.status === "REPAIR" || a.status === "QUALITY_CHECK").map(a => (
                      <div key={a.id} onClick={() => { setSelectedProjectIdForMaterials(a.id); fetchProjectMaterials(a.id); fetchMeasurementHistory(a.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{a.vehicle}</p>
                        <p className="text-slate-500">الخدمة: {a.service}</p>
                        <p className="text-slate-400">الفني: {a.mechanic}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(a.cost)}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 4: Ready for Delivery */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">سيارات جاهزة للتسليم</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {appointments.filter(a => a.status === "DELIVERY").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {appointments.filter(a => a.status === "DELIVERY").map(a => (
                      <div key={a.id} onClick={() => { setSelectedProjectIdForMaterials(a.id); fetchProjectMaterials(a.id); fetchMeasurementHistory(a.id); setShowMaterialsModal(true); }} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{a.vehicle}</p>
                        <p className="text-slate-500 font-bold text-emerald-600">تسليم وفاتورة</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-extrabold text-slate-900">{formatMoney(a.cost)}</span>
                          <span className="text-xs text-emerald-600 font-bold">جاهز ✓</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: FACTORY (PRODUCTION) */}
          {activeTab === "factory" && (
            <div className="space-y-6 text-right animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">إدارة خطوط الإنتاج والتشغيل في صالة المصنع</h2>
                  <p className="text-sm text-slate-500 mt-1">تتبع وجدولة أوامر التصنيع، سحب المواد الخام من المخازن، ومراقبة جودة خطوط التغليف والتعبئة</p>
                </div>
                <button
                  onClick={() => setShowAddProduction(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>إصدار أمر إنتاج وتشغيل جديد</span>
                </button>
              </div>

              {/* Kanban-like grid view of production orders */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Column 1: Raw Materials Preparation */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">صرف وتجهيز الخامات</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {productionOrders.filter(po => po.status === "RAW_MATERIALS" || po.status === "PRODUCTION_ORDER").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {productionOrders.filter(po => po.status === "RAW_MATERIALS" || po.status === "PRODUCTION_ORDER").map(po => (
                      <div key={po.id} onClick={() => advanceProductionStatus(po.id)} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{po.product}</p>
                        <p className="text-slate-500">الكمية: {po.quantity} وحدة</p>
                        <p className="text-slate-400">الخامات: {po.rawMaterials}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-indigo-600">{po.machine}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Manufacturing */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">جاري القص والتشكيل</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {productionOrders.filter(po => po.status === "MANUFACTURING").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {productionOrders.filter(po => po.status === "MANUFACTURING").map(po => (
                      <div key={po.id} onClick={() => advanceProductionStatus(po.id)} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{po.product}</p>
                        <p className="text-slate-500">الكمية: {po.quantity} وحدة</p>
                        <p className="text-slate-400">المشرف: {po.supervisor}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-indigo-600">{po.machine}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Quality Check & Packaging */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">فحص الجودة والتعبئة</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {productionOrders.filter(po => po.status === "QUALITY_CHECK" || po.status === "PACKAGING").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {productionOrders.filter(po => po.status === "QUALITY_CHECK" || po.status === "PACKAGING").map(po => (
                      <div key={po.id} onClick={() => advanceProductionStatus(po.id)} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{po.product}</p>
                        <p className="text-slate-500">الكمية: {po.quantity} وحدة</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-indigo-600">{po.machine}</span>
                          <span className="text-[10px] text-slate-400 font-bold">المرحلة التالية ➔</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 4: Finished Goods */}
                <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-700">منتجات تامة وجاهزة</span>
                    <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-md font-bold">
                      {productionOrders.filter(po => po.status === "FINISHED_GOODS" || po.status === "DELIVERY").length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {productionOrders.filter(po => po.status === "FINISHED_GOODS" || po.status === "DELIVERY").map(po => (
                      <div key={po.id} onClick={() => advanceProductionStatus(po.id)} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-400 cursor-pointer space-y-2 text-xs">
                        <p className="font-extrabold text-sm text-slate-800">{po.product}</p>
                        <p className="text-slate-500 font-bold text-emerald-600">منتج تام بالمخازن</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-slate-900">{po.quantity} وحدة</span>
                          <span className="text-xs text-emerald-600 font-bold">{po.status === "DELIVERY" ? "شحن ✓" : "بانتظار الشحن ➔"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 6. EXPENSES FINANCE */}
          {activeTab === "expenses" && (
            <div className="space-y-5 text-right">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">إدارة مصروفات المنشأة والخزينة</h2>
                  <p className="text-sm text-slate-500 mt-1">تتبع التدفقات النقدية الخارجة، أجور الموظفين، تكاليف الإيجار وفواتير الخدمات العامة</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  <span>تسجيل مصروف جديد</span>
                </button>
              </div>

              {/* EXPENSES LOG TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-20 font-bold">لا توجد مصروفات مسجلة حتى الآن.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-4 font-extrabold">تاريخ الصرف</th>
                          <th className="px-5 py-4 font-extrabold">التصنيف</th>
                          <th className="px-5 py-4 font-extrabold">الوصف والبيان التفصيلي</th>
                          <th className="px-5 py-4 font-extrabold text-left">القيمة المالية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-slate-800 font-mono font-semibold">
                              {new Date(exp.expenseDate).toLocaleDateString("ar-SA")}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-block text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1 rounded-lg">
                                {exp.category === "UTILITIES" ? "خدمات ومرافق" : 
                                 exp.category === "RENT" ? "إيجارات" : 
                                 exp.category === "MARKETING" ? "تسويق وإعلانات" : 
                                 exp.category === "SALARIES" ? "أجور ورواتب" : "شحن ولوجستيات"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-700 font-semibold leading-relaxed">{exp.description || "بدون بيان إضافي"}</td>
                            <td className="px-5 py-4 text-left font-black text-rose-600 text-base font-mono">{formatMoney(exp.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- MODAL DIALOGS --- */}

          {/* ADD CUSTOMER MODAL */}
          {showAddCustomer && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddCustomer(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">تسجيل ملف عميل جديد (CRM)</h3>
                <form onSubmit={createCustomer} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الاسم الكامل / اسم الشركة</label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="شركة أحمد اللوجستية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">رقم الهاتف</label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-medium"
                        placeholder="+966500000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الرقم الضريبي</label>
                      <input
                        type="text"
                        value={newCustTax}
                        onChange={(e) => setNewCustTax(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none font-mono text-left font-medium"
                        placeholder="300012345600003"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الحد الائتماني ($)</label>
                      <input
                        type="number"
                        value={newCustLimit}
                        onChange={(e) => setNewCustLimit(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">عنوان التوصيل والشحن</label>
                    <input
                      type="text"
                      value={newCustShipping}
                      onChange={(e) => setNewCustShipping(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="شارع العليا العام، الرياض، المملكة العربية السعودية"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">عنوان الفوترة</label>
                    <input
                      type="text"
                      value={newCustBilling}
                      onChange={(e) => setNewCustBilling(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="نفس عنوان التوصيل الرئيسي"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد تسجيل ملف العميل في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* OPEN SHIFT MODAL */}
          {showOpenShiftModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowOpenShiftModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right flex items-center gap-2 justify-end">
                  <span>فتح وردية محاسبية جديدة</span>
                  <Lock className="w-5 h-5 text-indigo-650" />
                </h3>
                <form onSubmit={handleOpenShift} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-705 mb-2 text-right">رصيد عهدة الكاش الافتتاحي ($)</label>
                    <input
                      type="text"
                      required
                      value={shiftOpeningBalance}
                      onChange={(e) => setShiftOpeningBalance(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-705 mb-2 text-right">ملاحظات فتح العهدة</label>
                    <textarea
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="عهدتي لصباح اليوم..."
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-750 hover:from-indigo-700 hover:to-violet-800 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    بدء الوردية وتفعيل الكاشير
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CLOSE SHIFT MODAL */}
          {showCloseShiftModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowCloseShiftModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right flex items-center gap-2 justify-end">
                  <span>إغلاق الوردية وتسوية الخزنة</span>
                  <Lock className="w-5 h-5 text-rose-500" />
                </h3>
                <form onSubmit={handleCloseShift} className="space-y-5">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-sm space-y-2.5 text-right">
                    <p className="text-slate-600 font-bold text-right">ملخص الوردية الحالية:</p>
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-slate-800">{activeShift ? formatMoney(activeShift.openingBalance) : "$0.00"}</span>
                      <span>الرصيد الافتتاحي:</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-emerald-600">
                        {activeShift && activeShift.payments
                          ? formatMoney(
                              activeShift.payments
                                .filter((p: any) => p.paymentMethod === "CASH")
                                .reduce((acc: number, p: any) => acc + Number(p.amount), 0)
                            )
                          : "$0.00"}
                      </span>
                      <span>متحصلات المبيعات النقدية:</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-705 mb-2 text-right">المبلغ الفعلي الموجود بالدرج المالي ($)</label>
                    <input
                      type="text"
                      required
                      value={shiftActualCash}
                      onChange={(e) => setShiftActualCash(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-705 mb-2 text-right">ملاحظات التسوية والتسليم</label>
                    <textarea
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="أية اختلافات أو فوارق تم رصدها..."
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    توثيق تسوية الدرج وإغلاق الوردية
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PROJECT MATERIALS MODAL */}
          {showMaterialsModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-2xl p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button
                  onClick={() => {
                    setShowMaterialsModal(false);
                    setSelectedProjectIdForMaterials(null);
                  }}
                  className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold"
                >
                  ✕
                </button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right flex items-center gap-2 justify-end">
                  <span>إدارة قطع الغيار والمواد المستهلكة بكارت الصيانة</span>
                  <Wrench className="w-5 h-5 text-indigo-650" />
                </h3>

                {/* Add Material Form */}
                <form onSubmit={handleAddProjectMaterial} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 mb-6 text-right">
                  <h4 className="text-sm font-extrabold text-slate-800">إضافة قطعة غيار أو مادة خام جديدة:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-505 mb-1.5 text-right">اختر صنف المخزون المتوفر</label>
                      <select
                        required
                        value={newMaterialVariantId}
                        onChange={(e) => setNewMaterialVariantId(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold text-right"
                      >
                        <option value="">اختر قطعة الغيار...</option>
                        {products.map((p) =>
                          p.variants?.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {p.name} ({v.sku}) - بسعر: {formatMoney(v.price)}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-505 mb-1.5 text-right">الكمية المطلوبة</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newMaterialQty}
                        onChange={(e) => setNewMaterialQty(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-3 focus:outline-none text-slate-800 focus:border-indigo-500 text-center font-bold font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      إضافة قطعة الغيار وخصمها من المخزن
                    </button>
                  </div>
                </form>

                {/* Materials List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-800 text-right">قائمة المواد وقطع الغيار المربوطة حالياً بالطلب:</h4>
                  {projectMaterials.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      لم يتم استهلاك قطع غيار أو مواد خام مسجلة في هذا الطلب بعد.
                    </p>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 text-right">
                      {projectMaterials.map((pm: any) => (
                        <div key={pm.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between text-right text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleRemoveProjectMaterial(selectedProjectIdForMaterials!, pm.id)}
                              className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors cursor-pointer"
                            >
                              إزالة وإعادة للمخزن
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-slate-800 text-xs text-right">{pm.variant?.product?.name || "قطعة غيار"}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 text-right">SKU: {pm.variant?.sku} | الكمية: {Number(pm.quantity)} وحدة</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Measurements & Revisions History */}
                <div className="border-t border-slate-100 pt-5 mt-5 text-right space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-800 text-right">سجل المقاسات الهندسية ومراجعاتها:</h4>
                  
                  {/* Edit Measurements Field */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!token || !selectedProjectIdForMaterials) return;
                    const proj = projects.find(p => p.id === selectedProjectIdForMaterials) || appointments.find(a => a.id === selectedProjectIdForMaterials);
                    const currentMeas = proj?.measurements || "";
                    const newText = prompt("أدخل قيمة المقاس الهندسي الجديد:", currentMeas);
                    if (newText === null) return;
                    try {
                      const res = await fetch(`${API_BASE_URL}/projects/${selectedProjectIdForMaterials}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ measurements: { text: newText } })
                      });
                      if (res.ok) {
                        fetchMeasurementHistory(selectedProjectIdForMaterials);
                        fetchAllData();
                        showTemporarySuccess("تم تعديل المقاس الهندسي وأرشفة المراجعة التاريخية!");
                      }
                    } catch (err) {}
                  }} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-right">
                    <button type="submit" className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl cursor-pointer">
                      تعديل المقاس الهندسي الحالي ✎
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold text-right">المقاس النشط حالياً:</span>
                      <span className="font-mono font-black text-indigo-700 text-sm text-right">
                        {projects.find(p => p.id === selectedProjectIdForMaterials)?.measurements || appointments.find(a => a.id === selectedProjectIdForMaterials)?.service || "لم يسجل بعد"}
                      </span>
                    </div>
                  </form>

                  {/* History Log timeline */}
                  {measurementHistory.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl">لا توجد مراجعات أو مقاسات هندسية مؤرشفة سابقا لهذا المشروع.</p>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-right">
                      {measurementHistory.map((h: any, idx: number) => (
                        <div key={h.id} className="bg-slate-50/70 p-3 rounded-xl border border-slate-150 text-xs flex justify-between items-center text-right font-medium">
                          <span className="text-[10px] text-slate-400 font-mono text-left">{new Date(h.changedAt).toLocaleString("ar-SA")}</span>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] me-2 text-right">إصدار #{measurementHistory.length - idx}</span>
                            <span className="font-mono font-black text-indigo-600 text-right">{h.measurementsText}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Advancement Section */}
                {(() => {
                  const proj = projects.find((p: any) => p.id === selectedProjectIdForMaterials);
                  const isApp = appointments.find((a: any) => a.id === selectedProjectIdForMaterials);
                  const activeObj = proj || isApp;
                  if (!activeObj) return null;

                  return (
                    <div className="border-t border-slate-105 pt-5 mt-5 flex justify-between items-center text-right">
                      <button
                        onClick={async () => {
                          if (proj) {
                            await advanceProjectStatus(proj.id);
                          } else if (isApp) {
                            await advanceAppointmentStatus(isApp.id);
                          }
                          // Refresh details in modal
                          fetchProjectMaterials(selectedProjectIdForMaterials!);
                          fetchMeasurementHistory(selectedProjectIdForMaterials!);
                        }}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition-all active:scale-[0.98] cursor-pointer"
                      >
                        نقل كارت العمل للمرحلة التالية ➔
                      </button>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold text-right">الحالة التشغيلية الحالية:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {getStatusTextArabic(activeObj.status)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* TAX RATE MODAL */}
          {showTaxModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowTaxModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right flex items-center gap-2 justify-end">
                  <span>إضافة نسبة ضريبية جديدة</span>
                  <Percent className="w-5 h-5 text-indigo-650" />
                </h3>
                <form onSubmit={handleCreateTaxRate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">اسم النسبة الضريبية</label>
                    <input
                      type="text"
                      required
                      value={newTaxName}
                      onChange={(e) => setNewTaxName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-bold"
                      placeholder="ضريبة القيمة المضافة 15%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">النسبة المئوية (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={newTaxRate}
                      onChange={(e) => setNewTaxRate(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      placeholder="15.00"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    حفظ وتنشيط النسبة الضريبية
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PRODUCT MODAL */}
          {showAddProduct && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddProduct(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">إدراج منتج جديد في دليل المنشأة</h3>
                <form onSubmit={createProduct} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">اسم السلعة / المنتج</label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="شاشة كمبيوتر 4K"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">العلامة التجارية / الشركة المصنعة</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="سامسونج"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الوصف التفصيلي</label>
                    <textarea
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none h-20 resize-none text-right font-medium"
                      placeholder="اكتب تفاصيل ومواصفات المنتج هنا..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 border border-slate-200 rounded-2xl text-right">
                    <div className="col-span-2">
                      <h4 className="text-xs font-black text-indigo-600 mb-2 text-right">خصائص وتكلفة الصنف الأول للمنتج</h4>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">رمز SKU المخزني (فريد)</label>
                      <input
                        type="text"
                        required
                        value={newProdSKU}
                        onChange={(e) => setNewProdSKU(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none font-mono text-left font-bold"
                        placeholder="MON-4K-BLK"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">رمز الباركود (UPC/EAN)</label>
                      <input
                        type="text"
                        value={newProdBarcode}
                        onChange={(e) => setNewProdBarcode(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none font-mono text-left font-bold"
                        placeholder="8806090000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">سعر البيع الافتراضي ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">تكلفة الشراء الأصلية ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <label className="block text-xs font-bold text-slate-700 mb-2 text-right">خاصية مميزة للمنتج (مثال: لون أو حجم)</label>
                      <input
                        type="text"
                        value={newProdColor}
                        onChange={(e) => setNewProdColor(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="أسود داكن"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                  >
                    تأكيد إدراج المنتج في دليل المخزن
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD EXPENSE MODAL */}
          {showAddExpense && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddExpense(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-rose-650 text-right">تقييد وقيد مصروفات المنشأة</h3>
                <form onSubmit={createExpense} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">المبلغ المالي ($)</label>
                      <input
                        type="number"
                        required
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 text-right">تصنيف المصروف</label>
                      <select
                        value={newExpCategory}
                        onChange={(e) => setNewExpCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-3 text-sm text-slate-800 outline-none font-bold cursor-pointer text-right"
                      >
                        <option value="UTILITIES">خدمات ومرافق (كهرباء/ماء/هاتف)</option>
                        <option value="RENT">إيجار المكاتب والمستودعات</option>
                        <option value="MARKETING">تسويق وإعلانات رقمية</option>
                        <option value="SALARIES">رواتب وأجور الموظفين</option>
                        <option value="LOGISTICS">شحن ونقل ولوجستيات</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">وصف وبيان الصرف</label>
                    <textarea
                      required
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none h-24 resize-none text-right font-medium"
                      placeholder="اكتب هنا ما يوضح سبب صرف الميزانية..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg shadow-rose-600/10 active:scale-[0.98]"
                  >
                    قيد العملية وخصمها من الميزانية
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD WAREHOUSE MODAL */}
          {showAddWarehouse && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddWarehouse(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">إدراج مستودع / فرع لوجستي جديد</h3>
                <form onSubmit={createWarehouse} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">اسم المستودع / الفرع</label>
                    <input
                      type="text"
                      required
                      value={newWhName}
                      onChange={(e) => setNewWhName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="مستودع المنطقة الوسطى الرئيسي"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">العنوان الجغرافي بالتفصيل</label>
                    <input
                      type="text"
                      value={newWhAddress}
                      onChange={(e) => setNewWhAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="المنطقة الصناعية الثانية، مخرج 15، الرياض"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                  >
                    تأكيد قيد المستودع في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STOCK ADJUSTMENT / INGEST MODAL */}
          {showAdjustStock && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAdjustStock(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 text-right">تسوية ورفع كميات المخزون المتوفرة</h3>
                <form onSubmit={adjustStock} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">المستودع / الفرع المستهدف</label>
                    <select
                      required
                      value={adjWarehouseId}
                      onChange={(e) => setAdjWarehouseId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-sm text-slate-800 outline-none font-bold cursor-pointer text-right"
                    >
                      <option value="">اختر مستودع التخزين...</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الصنف والرمز المخزني المستهدف (SKU)</label>
                    <select
                      required
                      value={adjVariantId}
                      onChange={(e) => setAdjVariantId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-2.5 py-2.5 text-sm text-slate-800 outline-none font-bold cursor-pointer text-right"
                    >
                      <option value="">اختر رمز SKU الصنف...</option>
                      {products.map((p) =>
                        p.variants?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {p.name} - SKU: {v.sku}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2 text-right">الكمية الجديدة المراد إضافتها (وحدة)</label>
                    <input
                      type="number"
                      required
                      value={adjQty}
                      onChange={(e) => setAdjQty(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg"
                  >
                    تأكيد إدخال وتسوية الكميات في المستودع
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- SETTINGS MODAL --- */}
          {showSettingsModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">إعدادات المنشأة والعملة</h3>
                <form onSubmit={saveSettings} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم المنشأة / العلامة التجارية</label>
                    <input
                      type="text"
                      required
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="أدخل اسم المنشأة..."
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">عملة التداول الافتراضية</label>
                    <select
                      value={settingsCurrency}
                      onChange={(e) => setSettingsCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold cursor-pointer"
                    >
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="AED">درهم إماراتي (AED)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="w-full mt-3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
                  >
                    {settingsLoading ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- SUPPLIERS MODAL --- */}
          {showSuppliersModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowSuppliersModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">إدارة الموردين - إضافة مورد جديد</h3>
                <form onSubmit={createSupplier} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم المورد / الشركة</label>
                    <input
                      type="text"
                      required
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="شركة التوريدات الوطنية"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={newSupplierEmail}
                        onChange={(e) => setNewSupplierEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono"
                        placeholder="supplier@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                      <input
                        type="text"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono"
                        placeholder="+966500000000"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">الرقم الضريبي (إن وجد)</label>
                    <input
                      type="text"
                      value={newSupplierTax}
                      onChange={(e) => setNewSupplierTax(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-mono"
                      placeholder="15-digit Tax ID"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">العنوان الوطني / التفصيلي</label>
                    <textarea
                      value={newSupplierAddress}
                      onChange={(e) => setNewSupplierAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium resize-none"
                      placeholder="شارع الملك فهد، الرياض، المملكة العربية السعودية"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد تسجيل المورد
                  </button>
                </form>

                {/* Suppliers list inside the modal for reference */}
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-black text-slate-850 mb-3 flex items-center justify-between">
                    <span>الموردين المسجلين حالياً</span>
                    <span className="text-xs text-slate-400 font-bold">({suppliers.length}) موردين</span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1 text-right">
                    {suppliers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4 font-bold">لا يوجد موردين مسجلين بعد.</p>
                    ) : (
                      suppliers.map((s) => (
                        <div key={s.id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-200/50">
                          <div className="text-right">
                            <p className="font-extrabold text-slate-800">{s.name}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{s.phone || "بدون هاتف"} | {s.email || "بدون بريد"}</p>
                          </div>
                          {s.taxNumber && (
                            <span className="bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                              الرقم الضريبي: {s.taxNumber}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- RECORD PURCHASE MODAL --- */}
          {showPurchaseModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowPurchaseModal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">توريد بضاعة للمستودع (شراء)</h3>
                <form onSubmit={createPurchase} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">المورد المسجل</label>
                    <select
                      required
                      value={purchaseSupplierId}
                      onChange={(e) => setPurchaseSupplierId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold cursor-pointer"
                    >
                      <option value="">اختر المورد الشاحن...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">المستودع المستلم</label>
                      <select
                        required
                        value={purchaseWarehouseId}
                        onChange={(e) => setPurchaseWarehouseId(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold cursor-pointer"
                      >
                        <option value="">اختر المستودع...</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">رقم فاتورة الشراء (PO)</label>
                      <input
                        type="text"
                        value={purchaseOrderNum}
                        onChange={(e) => setPurchaseOrderNum(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-mono"
                        placeholder="PO-XXXXXX"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">المنتج والصنف المراد توريده (SKU)</label>
                    <select
                      required
                      value={purchaseVariantId}
                      onChange={(e) => setPurchaseVariantId(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold cursor-pointer"
                    >
                      <option value="">اختر الصنف وتكلفة المنتج...</option>
                      {products.map((p) =>
                        p.variants?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {p.name} - SKU: {v.sku} (البيع: {formatMoney(v.price)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">تكلفة شراء الوحدة</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={purchaseCost}
                        onChange={(e) => setPurchaseCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">الكمية المشتراة</label>
                      <input
                        type="number"
                        required
                        value={purchaseQty}
                        onChange={(e) => setPurchaseQty(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات التوريد والشحنة</label>
                    <input
                      type="text"
                      value={purchaseNotes}
                      onChange={(e) => setPurchaseNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="شحنة بضائع وتغذية الربع الثالث للمخازن..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد استلام وتغذية المستودع بـ {purchaseQty} وحدة
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- FIRST TIME WELCOME MODAL --- */}
          {showWelcomeModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-[32px] w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-350 text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-3">
                  أهلاً بك في {tenantInfo?.businessName || regBusinessName}!
                </h3>
                
                <p className="text-slate-600 text-base font-medium leading-relaxed mb-6">
                  لقد تم بنجاح تأسيس نظامك الخاص ومساحة العمل السحابية لمنشأتك.
                  لقد قمنا بتهيئة إعدادات وتكوينات النظام لتلائم قطاع عملك المختار: 
                  <strong className="text-indigo-600 mx-1">
                    {getIndustryNameArabic(tenantInfo?.industryType || regIndustryType)}
                  </strong>.
                  <br />
                  يمكنك الآن البدء في تصفح سلة الكاشير (POS) أو إدراج المنتجات والعملاء.
                </p>

                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setIsFirstTimeSetup(false);
                    // Save in local storage so it never shows again for this tenant subdomain
                    if (tenantInfo?.subdomain) {
                      localStorage.setItem(`onboarded_${tenantInfo.subdomain}`, "true");
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  ابدأ العمل الآن
                </button>
              </div>
            </div>
          )}

          {/* ADD PROJECT MODAL */}
          {showAddProject && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddProject(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
                  {(tenantInfo?.industryType || regIndustryType) === "FURNITURE" ? "تسجيل مشروع وتفصيل جديد" : "إنشاء مشروع / مهمة استشارية جديدة"}
                </h3>
                <form onSubmit={createProject} className="space-y-5">
                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم المشروع / الطلب</label>
                    <input
                      type="text"
                      required
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder={(tenantInfo?.industryType || regIndustryType) === "FURNITURE" ? "تفصيل مجلس عربي خشب زان" : "تصميم الهوية الرقمية للموقع"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل</label>
                      <select
                        required
                        value={projClient}
                        onChange={(e) => setProjClient(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold cursor-pointer"
                      >
                        <option value="">اختر العميل للمشروع...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">الميزانية التقديرية ($)</label>
                      <input
                        type="number"
                        required
                        value={projAmount}
                        onChange={(e) => setProjAmount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                  </div>

                  {(tenantInfo?.industryType || regIndustryType) === "FURNITURE" && (
                    <div className="text-right">
                      <label className="block text-sm font-bold text-slate-700 mb-2">المقاسات المبدئية (العرض * الطول * الارتفاع)</label>
                      <input
                        type="text"
                        value={projMeas}
                        onChange={(e) => setProjMeas(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="4.5م * 3.8م * 1.0م"
                      />
                    </div>
                  )}

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات العمل والتنفيذ</label>
                    <textarea
                      value={projNotes}
                      onChange={(e) => setProjNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium resize-none"
                      placeholder="مواصفات الخامات والأقمشة وألوان الطلاء المطلوبة..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد إدراج المشروع في النظام
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD APPOINTMENT / REPAIR WORK ORDER MODAL */}
          {showAddAppointment && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddAppointment(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">استقبال مركبة جديدة وإصدار كارت صيانة</h3>
                <form onSubmit={createAppointment} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">العميل مالك السيارة</label>
                      <select
                        required
                        value={appCustomer}
                        onChange={(e) => setAppCustomer(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold cursor-pointer"
                      >
                        <option value="">اختر العميل مالك السيارة...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">بيانات السيارة ورقم اللوحة</label>
                      <input
                        type="text"
                        required
                        value={appVehicle}
                        onChange={(e) => setAppVehicle(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="نيسان باترول 2021 (ر س ص 4444)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">التكلفة التقديرية للإصلاح ($)</label>
                      <input
                        type="number"
                        required
                        value={appCost}
                        onChange={(e) => setAppCost(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">الشكوى / خدمة الصيانة المطلوبة</label>
                    <input
                      type="text"
                      required
                      value={appService}
                      onChange={(e) => setAppService(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="صوت طقطقة في المساعدين الأمامية + فحص كمبيوتر"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">مستشار الخدمة المسؤول</label>
                      <select
                        value={appAdvisor}
                        onChange={(e) => setAppAdvisor(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold"
                      >
                        <option value="سعود القحطاني">سعود القحطاني</option>
                        <option value="خالد الحربي">خالد الحربي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">الفني الميكانيكي المعين</label>
                      <select
                        value={appMechanic}
                        onChange={(e) => setAppMechanic(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold"
                      >
                        <option value="م. أشرف عبد العزيز">م. أشرف عبد العزيز</option>
                        <option value="م. محمد علي">م. محمد علي</option>
                        <option value="م. رامي فايز">م. رامي فايز</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد استقبال السيارة ودخولها الورشة
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADD PRODUCTION ORDER MODAL */}
          {showAddProduction && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 relative animate-in fade-in zoom-in-95 duration-200 text-right shadow-2xl">
                <button onClick={() => setShowAddProduction(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer text-base font-bold">✕</button>
                <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">إصدار أمر تشغيل وإنتاج جديد بالصالة</h3>
                <form onSubmit={createProductionOrder} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم المنتج النهائي</label>
                      <input
                        type="text"
                        required
                        value={prodOrdProduct}
                        onChange={(e) => setProdOrdProduct(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                        placeholder="قمصان قطنية فاخرة - دفعة 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">كمية الإنتاج المستهدفة</label>
                      <input
                        type="number"
                        required
                        value={prodOrdQty}
                        onChange={(e) => setProdOrdQty(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-left font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-slate-700 mb-2">المواد الخام اللازمة (BOM)</label>
                    <input
                      type="text"
                      required
                      value={prodOrdMaterials}
                      onChange={(e) => setProdOrdMaterials(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none text-right font-medium"
                      placeholder="12 لفة خيط قطن هندي + أزرار معدنية"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-right">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">خط تشغيل الماكينة المعين</label>
                      <select
                        value={prodOrdMachine}
                        onChange={(e) => setProdOrdMachine(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold"
                      >
                        <option value="خط الخياطة الدائرية A">خط الخياطة الدائرية A</option>
                        <option value="خط الكبس والتعبئة B">خط الكبس والتعبئة B</option>
                        <option value="خط سحب البلاستيك C">خط سحب البلاستيك C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">مشرف الصالة المسؤول</label>
                      <select
                        value={prodOrdSupervisor}
                        onChange={(e) => setProdOrdSupervisor(e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-3 text-sm text-slate-800 outline-none text-right font-bold"
                      >
                        <option value="م. محمود جلال">م. محمود جلال</option>
                        <option value="م. سامي فرحات">م. سامي فرحات</option>
                        <option value="م. أحمد الشافعي">م. أحمد الشافعي</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                  >
                    تأكيد إصدار أمر الإنتاج والبدء بالصرف
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
