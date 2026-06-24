import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templatesData = [
  {
    code: 'RETAIL',
    name: 'تجزئة وإدارة المحلات والمستودعات',
    description: 'قالب إدارة محلات التجزئة، السوبرماركت، محلات قطع الغيار، المكتبات، ومحلات الأجهزة الكهربائية.',
    industryType: 'RETAIL',
    modules: ['products', 'categories', 'brands', 'inventory', 'warehouses', 'purchases', 'sales', 'pos', 'finance', 'customers'],
    roles: [
      { code: 'OWNER', name: 'المالك', description: 'صلاحيات كاملة للمنشأة' },
      { code: 'MANAGER', name: 'المدير العام', description: 'إدارة العمليات اليومية للمحلات والمخازن' },
      { code: 'CASHIER', name: 'كاشير مبيعات', description: 'البيع وإصدار الفواتير الفورية عبر الـ POS' },
      { code: 'SALES', name: 'مسؤول مبيعات', description: 'إدارة وتتبع طلبات وفواتير المبيعات' },
      { code: 'INVENTORY_MANAGER', name: 'مسؤول المخزون', description: 'إدارة المستودعات، التسوية، وأوامر الشراء' },
      { code: 'ACCOUNTANT', name: 'المحاسب المالي', description: 'إدارة الخزينة والمصروفات والتقارير المالية' },
    ],
    permissions: [
      { role: 'OWNER', module: 'sales', action: '*' },
      { role: 'OWNER', module: 'inventory', action: '*' },
      { role: 'OWNER', module: 'finance', action: '*' },
      { role: 'OWNER', module: 'pos', action: '*' },
      { role: 'OWNER', module: 'customers', action: '*' },
      { role: 'OWNER', module: 'products', action: '*' },

      { role: 'CASHIER', module: 'pos', action: 'create' },
      { role: 'CASHIER', module: 'pos', action: 'view' },
      { role: 'CASHIER', module: 'customers', action: 'view' },
      { role: 'CASHIER', module: 'customers', action: 'create' },

      { role: 'INVENTORY_MANAGER', module: 'inventory', action: '*' },
      { role: 'INVENTORY_MANAGER', module: 'products', action: '*' },
      { role: 'INVENTORY_MANAGER', module: 'purchases', action: '*' },

      { role: 'ACCOUNTANT', module: 'finance', action: '*' },
      { role: 'ACCOUNTANT', module: 'sales', action: 'view' },
      { role: 'ACCOUNTANT', module: 'purchases', action: 'view' },
    ],
    dashboards: [
      { widgetCode: 'sales_today', widgetName: 'مبيعات اليوم', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
      { widgetCode: 'revenue', widgetName: 'إجمالي الإيرادات', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
      { widgetCode: 'profit', widgetName: 'صافي الأرباح', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
      { widgetCode: 'low_stock', widgetName: 'أصناف قاربت على النفاد', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
      { widgetCode: 'top_products', widgetName: 'المنتجات الأكثر مبيعاً', gridPos: { x: 0, y: 2, w: 6, h: 4 } },
      { widgetCode: 'inventory_alerts', widgetName: 'تنبيهات المخازن والمستودعات', gridPos: { x: 6, y: 2, w: 6, h: 4 } },
    ],
    workflows: []
  },
  {
    code: 'FURNITURE',
    name: 'تصميم وتصنيع الأثاث والديكور والمطابخ',
    description: 'قالب إدارة ورش تفصيل الأثاث، المطابخ، الألمنيوم، الزجاج، الرخام، ومشاغل الستائر والديكور الداخلي.',
    industryType: 'FURNITURE',
    modules: ['customers', 'projects', 'measurements', 'quotations', 'materials', 'inventory', 'production', 'installations', 'finance'],
    roles: [
      { code: 'OWNER', name: 'المالك', description: 'صلاحيات كاملة للمنشأة' },
      { code: 'PROJECT_MANAGER', name: 'مدير المشروعات', description: 'تخطيط وتنسيق عمليات التفصيل والتصنيع' },
      { code: 'MEASUREMENT_ENG', name: 'فني رفع المقاسات', description: 'الزيارات الميدانية ورفع المقاسات الفنية والرسومات' },
      { code: 'PRODUCTION_MANAGER', name: 'مدير المصنع/الورشة', description: 'إدارة الإنتاج، استهلاك المواد الخام، والتجهيز' },
      { code: 'INSTALLER', name: 'فني التركيبات', description: 'تركيب الطلبات للعميل وتسليم المشروع النهائي' },
      { code: 'ACCOUNTANT', name: 'المحاسب المالي', description: 'تتبع دفعات العملاء، الفواتير، وتكلفة الخامات' },
    ],
    permissions: [
      { role: 'OWNER', module: 'projects', action: '*' },
      { role: 'OWNER', module: 'measurements', action: '*' },
      { role: 'OWNER', module: 'production', action: '*' },
      { role: 'OWNER', module: 'installations', action: '*' },
      { role: 'OWNER', module: 'finance', action: '*' },

      { role: 'MEASUREMENT_ENG', module: 'projects', action: 'view' },
      { role: 'MEASUREMENT_ENG', module: 'measurements', action: '*' },

      { role: 'PRODUCTION_MANAGER', module: 'production', action: '*' },
      { role: 'PRODUCTION_MANAGER', module: 'inventory', action: 'view' },

      { role: 'INSTALLER', module: 'installations', action: '*' },
      { role: 'INSTALLER', module: 'projects', action: 'view' },
    ],
    dashboards: [
      { widgetCode: 'pending_measurements', widgetName: 'زيارات رفع المقاسات المعلقة', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
      { widgetCode: 'projects_in_progress', widgetName: 'مشاريع قيد التنفيذ والعمل', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
      { widgetCode: 'production_status', widgetName: 'حالة التصنيع والإنتاج بالورشة', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
      { widgetCode: 'upcoming_installations', widgetName: 'مواعيد التركيبات القادمة', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
      { widgetCode: 'outstanding_payments', widgetName: 'مستحقات دفعات العملاء المعلقة', gridPos: { x: 0, y: 2, w: 6, h: 4 } },
      { widgetCode: 'material_usage', widgetName: 'استهلاك المواد الخام والخشب والرخام', gridPos: { x: 6, y: 2, w: 6, h: 4 } },
    ],
    workflows: [
      { entityType: 'PROJECT', stateCode: 'LEAD', stateName: 'طلب جديد / تواصل', sortOrder: 1, isInitial: true, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'MEASUREMENT_VISIT', stateName: 'موعد رفع المقاسات', sortOrder: 2, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'QUOTATION', stateName: 'إعداد وتسعير العرض المالي', sortOrder: 3, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'APPROVAL', stateName: 'تم اعتماد العقد والدفعة الأولى', sortOrder: 4, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'PRODUCTION', stateName: 'التصنيع في الورشة / المصنع', sortOrder: 5, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'INSTALLATION', stateName: 'التركيب في موقع العميل', sortOrder: 6, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'DELIVERY', stateName: 'التسليم النهائي والدفعة الأخيرة', sortOrder: 7, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'COMPLETED', stateName: 'اكتمل المشروع وتوقيع المخالصة', sortOrder: 8, isInitial: false, isFinal: true },
    ]
  },
  {
    code: 'GARAGE',
    name: 'مراكز صيانة وورش السيارات',
    description: 'قالب إدارة ورش ميكانيكا وكهرباء السيارات، مراكز الإطارات، تغيير الزيوت، ومراكز الفحص الشامل.',
    industryType: 'GARAGE',
    modules: ['customers', 'vehicles', 'service_history', 'appointments', 'projects', 'inventory', 'finance'],
    roles: [
      { code: 'OWNER', name: 'المالك', description: 'صلاحيات كاملة للمنشأة' },
      { code: 'SERVICE_ADVISOR', name: 'مستشار الخدمة', description: 'استقبال السيارات، كتابة الملاحظات، وإعداد التقديرات والاتصال بالعميل' },
      { code: 'MECHANIC', name: 'فني الصيانة / الميكانيكي', description: 'تنفيذ أوامر الفحص والإصلاح الميكانيكي أو الكهربائي' },
      { code: 'INVENTORY_MANAGER', name: 'مسؤول قطع الغيار', description: 'إدارة مخزون قطع الغيار والزيوت والإطارات وتتبعها' },
      { code: 'CASHIER', name: 'محاسب كاشير الورشة', description: 'استلام الدفعات وإصدار فواتير الصيانة' },
      { code: 'ACCOUNTANT', name: 'المحاسب المالي للورشة', description: 'تتبع النفقات التشغيلية للورشة والأرباح وتكلفة قطع الغيار المشتراة' },
    ],
    permissions: [
      { role: 'OWNER', module: 'vehicles', action: '*' },
      { role: 'OWNER', module: 'projects', action: '*' },
      { role: 'OWNER', module: 'inventory', action: '*' },
      { role: 'OWNER', module: 'finance', action: '*' },

      { role: 'SERVICE_ADVISOR', module: 'vehicles', action: '*' },
      { role: 'SERVICE_ADVISOR', module: 'appointments', action: '*' },
      { role: 'SERVICE_ADVISOR', module: 'projects', action: 'create' },
      { role: 'SERVICE_ADVISOR', module: 'projects', action: 'view' },

      { role: 'MECHANIC', module: 'projects', action: 'view' },
      { role: 'MECHANIC', module: 'projects', action: 'edit' }, // to update status of work order
    ],
    dashboards: [
      { widgetCode: 'today_appointments', widgetName: 'مواعيد حجز الصيانة اليوم', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
      { widgetCode: 'vehicles_in_service', widgetName: 'السيارات قيد الخدمة في الورشة', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
      { widgetCode: 'pending_repairs', widgetName: 'أعطال بانتظار موافقة العميل', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
      { widgetCode: 'parts_inventory', widgetName: 'مستويات قطع الغيار والزيوت', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
      { widgetCode: 'revenue', widgetName: 'دخل مركز الصيانة المالي', gridPos: { x: 0, y: 2, w: 6, h: 4 } },
      { widgetCode: 'technician_performance', widgetName: 'كفاءة وإنتاجية الفنيين والميكانيكيين', gridPos: { x: 6, y: 2, w: 6, h: 4 } },
    ],
    workflows: [
      { entityType: 'WORK_ORDER', stateCode: 'VEHICLE_CHECK_IN', stateName: 'دخول واستلام السيارة', sortOrder: 1, isInitial: true, isFinal: false },
      { entityType: 'WORK_ORDER', stateCode: 'INSPECTION', stateName: 'الفحص وتشخيص الأعطال', sortOrder: 2, isInitial: false, isFinal: false },
      { entityType: 'WORK_ORDER', stateCode: 'QUOTATION', stateName: 'تقدير التكلفة وقطع الغيار', sortOrder: 3, isInitial: false, isFinal: false },
      { entityType: 'WORK_ORDER', stateCode: 'APPROVAL', stateName: 'بانتظار موافقة العميل على التكلفة', sortOrder: 4, isInitial: false, isFinal: false },
      { entityType: 'WORK_ORDER', stateCode: 'REPAIR', stateName: 'جاري العمل والإصلاح من الفني', sortOrder: 5, isInitial: false, isFinal: false },
      { entityType: 'WORK_ORDER', stateCode: 'QUALITY_CHECK', stateName: 'تجربة السيارة واختبار الجودة', sortOrder: 6, isInitial: false, isFinal: false },
      { entityType: 'WORK_ORDER', stateCode: 'DELIVERY', stateName: 'جاهزة للتسليم وإصدار الفاتورة', sortOrder: 7, isInitial: false, isFinal: true },
    ]
  },
  {
    code: 'FACTORY',
    name: 'المصانع وإدارة الإنتاج وخطوط التصنيع',
    description: 'قالب إدارة خطوط الإنتاج والتشغيل في مصانع الأثاث، الملابس، الأغذية، البلاستيك، المعادن والتغليف.',
    industryType: 'FACTORY',
    modules: ['inventory', 'purchases', 'production', 'machines', 'maintenance', 'finance'],
    roles: [
      { code: 'OWNER', name: 'المالك', description: 'صلاحيات كاملة للمنشأة' },
      { code: 'PRODUCTION_MANAGER', name: 'مدير الإنتاج والخطوط', description: 'تخطيط أوامر تشغيل المصنع وجدولتها والإنتاجية' },
      { code: 'FACTORY_SUPERVISOR', name: 'مشرف الصالة/الخط', description: 'متابعة حركة العمال والماكينات والتسليم اليومي للخطوط' },
      { code: 'WAREHOUSE_MANAGER', name: 'مسؤول خامات المخازن', description: 'صرف المواد الخام للمكائن واستلام المنتج النهائي وتغليفه' },
      { code: 'QUALITY_CONTROLLER', name: 'مراقب الجودة والصلاحية', description: 'فحص عينات المنتج ومطابقتها للمواصفات ومكافحة التالف' },
      { code: 'ACCOUNTANT', name: 'المحاسب المالي للمصنع', description: 'إعادة احتساب تكاليف الإنتاج، تكلفة الخامات المستهلكة، وأجور العمال والربح' },
    ],
    permissions: [
      { role: 'OWNER', module: 'production', action: '*' },
      { role: 'OWNER', module: 'machines', action: '*' },
      { role: 'OWNER', module: 'inventory', action: '*' },
      { role: 'OWNER', module: 'finance', action: '*' },

      { role: 'PRODUCTION_MANAGER', module: 'production', action: '*' },
      { role: 'PRODUCTION_MANAGER', module: 'machines', action: 'view' },

      { role: 'QUALITY_CONTROLLER', module: 'production', action: 'view' },
      { role: 'QUALITY_CONTROLLER', module: 'production', action: 'edit' },
    ],
    dashboards: [
      { widgetCode: 'production_status', widgetName: 'حالة أوامر تشغيل خطوط الإنتاج', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
      { widgetCode: 'machine_utilization', widgetName: 'مستوى استهلاك وتشغيل الماكينات', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
      { widgetCode: 'material_consumption', widgetName: 'حجم استهلاك المواد الخام والخشب والمعدن', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
      { widgetCode: 'quality_issues', widgetName: 'المنتجات التالفة ومطابقة الجودة', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
      { widgetCode: 'factory_output', widgetName: 'معدل الإنتاج الإجمالي والإنتاجية للمصنع', gridPos: { x: 0, y: 2, w: 6, h: 4 } },
    ],
    workflows: [
      { entityType: 'PRODUCTION', stateCode: 'RAW_MATERIALS', stateName: 'طلب وتجهيز الخامات والورق والخشب', sortOrder: 1, isInitial: true, isFinal: false },
      { entityType: 'PRODUCTION', stateCode: 'PRODUCTION_ORDER', stateName: 'إعداد أمر التشغيل والخطوط', sortOrder: 2, isInitial: false, isFinal: false },
      { entityType: 'PRODUCTION', stateCode: 'MANUFACTURING', stateName: 'جاري التصنيع والقص والتشكيل للمنتج', sortOrder: 3, isInitial: false, isFinal: false },
      { entityType: 'PRODUCTION', stateCode: 'QUALITY_CHECK', stateName: 'فحص الجودة والمواصفات للمنتجات', sortOrder: 4, isInitial: false, isFinal: false },
      { entityType: 'PRODUCTION', stateCode: 'PACKAGING', stateName: 'التغليف والتعبئة والفرز للمنتجات', sortOrder: 5, isInitial: false, isFinal: false },
      { entityType: 'PRODUCTION', stateCode: 'FINISHED_GOODS', stateName: 'نقل المنتجات التامة لمخازن المبيعات', sortOrder: 6, isInitial: false, isFinal: false },
      { entityType: 'PRODUCTION', stateCode: 'DELIVERY', stateName: 'شحن وتسليم المنتجات للعملاء', sortOrder: 7, isInitial: false, isFinal: true },
    ]
  },
  {
    code: 'SERVICE',
    name: 'الشركات الخدمية والاستشارات والمقاولات',
    description: 'قالب إدارة شركات البرمجة والتصميم، وكالات التسويق، مكاتب المحاماة والاستشارات، ومكاتب المحاسبة.',
    industryType: 'SERVICE',
    modules: ['crm', 'projects', 'teams', 'contracts', 'finance'],
    roles: [
      { code: 'OWNER', name: 'المالك', description: 'صلاحيات كاملة للمنشأة' },
      { code: 'PROJECT_MANAGER', name: 'مدير المشاريع', description: 'تخطيط المشاريع وتوزيع المهام ومراقبة الأداء والمواعيد' },
      { code: 'TEAM_LEADER', name: 'قائد الفريق الفني', description: 'إدارة وتتبع إنتاجية المهام والمطورين / المصممين' },
      { code: 'EMPLOYEE', name: 'الموظف / المستشار / المحامي', description: 'العمل على المهام المسندة ورفع التقارير وتحديث الحالة اليومية' },
      { code: 'SALES_MANAGER', name: 'مدير المبيعات والعقود', description: 'إدارة العملاء المحتملين وتوقيع العقود والمقترحات المالية' },
      { code: 'ACCOUNTANT', name: 'المحاسب المالي للشركة', description: 'الفواتير، الرواتب، تتبع سلف الموظفين والمصروفات الإدارية' },
    ],
    permissions: [
      { role: 'OWNER', module: 'crm', action: '*' },
      { role: 'OWNER', module: 'projects', action: '*' },
      { role: 'OWNER', module: 'teams', action: '*' },
      { role: 'OWNER', module: 'finance', action: '*' },

      { role: 'PROJECT_MANAGER', module: 'projects', action: '*' },
      { role: 'PROJECT_MANAGER', module: 'teams', action: 'view' },

      { role: 'EMPLOYEE', module: 'projects', action: 'view' },
      { role: 'EMPLOYEE', module: 'tasks', action: 'view' },
      { role: 'EMPLOYEE', module: 'tasks', action: 'edit' }, // update status of tasks
    ],
    dashboards: [
      { widgetCode: 'active_projects', widgetName: 'المشاريع النشطة الجارية', gridPos: { x: 0, y: 0, w: 3, h: 2 } },
      { widgetCode: 'pending_tasks', widgetName: 'المهام المعلقة بانتظار الإنجاز', gridPos: { x: 3, y: 0, w: 3, h: 2 } },
      { widgetCode: 'leads_pipeline', widgetName: 'فرص المبيعات المحتملة الجارية', gridPos: { x: 6, y: 0, w: 3, h: 2 } },
      { widgetCode: 'revenue', widgetName: 'أرباح الشركة المالية الجارية', gridPos: { x: 9, y: 0, w: 3, h: 2 } },
      { widgetCode: 'team_productivity', widgetName: 'مستوى إنتاجية الموظفين والمهام', gridPos: { x: 0, y: 2, w: 6, h: 4 } },
      { widgetCode: 'upcoming_meetings', widgetName: 'مواعيد الاجتماعات الهامة القادمة', gridPos: { x: 6, y: 2, w: 6, h: 4 } },
    ],
    workflows: [
      { entityType: 'PROJECT', stateCode: 'LEAD', stateName: 'فرصة مبيعات / استفسار جديد', sortOrder: 1, isInitial: true, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'QUALIFICATION', stateName: 'دراسة المتطلبات الفنية والاحتياج', sortOrder: 2, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'PROPOSAL', stateName: 'تقديم المقترح الفني والمالي للعميل', sortOrder: 3, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'CONTRACT', stateName: 'تم توقيع العقد والموافقة', sortOrder: 4, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'PROJECT_SETUP', stateName: 'تأسيس المشروع والبدء بالعمل', sortOrder: 5, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'BILLING', stateName: 'الفواتير ودفعات المشروع المستحقة', sortOrder: 6, isInitial: false, isFinal: false },
      { entityType: 'PROJECT', stateCode: 'COMPLETED', stateName: 'تسليم المشروع النهائي والمخالصة', sortOrder: 7, isInitial: false, isFinal: true },
    ]
  }
];

async function main() {
  console.log('Seeding SaaS Business Templates...');

  for (const tData of templatesData) {
    console.log(`Processing template: ${tData.code}...`);

    // 1. Create or Update BusinessTemplate
    const bTemplate = await prisma.businessTemplate.upsert({
      where: { code: tData.code },
      update: {
        name: tData.name,
        description: tData.description,
        industryType: tData.industryType,
      },
      create: {
        code: tData.code,
        name: tData.name,
        description: tData.description,
        industryType: tData.industryType,
      },
    });

    // 2. Clean and Create TemplateModules
    await prisma.templateModule.deleteMany({ where: { templateId: bTemplate.id } });
    await prisma.templateModule.createMany({
      data: tData.modules.map((mod) => ({
        templateId: bTemplate.id,
        moduleId: mod,
        isRequired: true,
      })),
    });

    // 3. Clean and Create TemplateDashboard widgets
    await prisma.templateDashboard.deleteMany({ where: { templateId: bTemplate.id } });
    await prisma.templateDashboard.createMany({
      data: tData.dashboards.map((dash) => ({
        templateId: bTemplate.id,
        widgetCode: dash.widgetCode,
        widgetName: dash.widgetName,
        gridPos: dash.gridPos,
      })),
    });

    // 4. Clean and Create TemplateWorkflows
    await prisma.templateWorkflow.deleteMany({ where: { templateId: bTemplate.id } });
    if (tData.workflows.length > 0) {
      await prisma.templateWorkflow.createMany({
        data: tData.workflows.map((wf) => ({
          templateId: bTemplate.id,
          entityType: wf.entityType,
          stateCode: wf.stateCode,
          stateName: wf.stateName,
          sortOrder: wf.sortOrder,
          isInitial: wf.isInitial,
          isFinal: wf.isFinal,
        })),
      });
    }

    // 5. Clean and Create TemplateRoles & TemplatePermissions
    const existingRoles = await prisma.templateRole.findMany({ where: { templateId: bTemplate.id } });
    for (const r of existingRoles) {
      await prisma.templatePermission.deleteMany({ where: { templateRoleId: r.id } });
    }
    await prisma.templateRole.deleteMany({ where: { templateId: bTemplate.id } });

    for (const roleData of tData.roles) {
      const tRole = await prisma.templateRole.create({
        data: {
          templateId: bTemplate.id,
          code: roleData.code,
          name: roleData.name,
          description: roleData.description,
        },
      });

      // Filter and insert permissions for this role
      const rolePermsData = tData.permissions
        .filter((p) => p.role === roleData.code)
        .map((p) => ({
          templateRoleId: tRole.id,
          module: p.module,
          action: p.action,
        }));

      if (rolePermsData.length > 0) {
        await prisma.templatePermission.createMany({
          data: rolePermsData,
        });
      }
    }
  }

  console.log('Seeding templates successfully completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
