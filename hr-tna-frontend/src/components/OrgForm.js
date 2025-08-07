import { useForm, useFieldArray, FormProvider, Controller } from "react-hook-form";
import React, { useEffect, useState, Component } from "react"; 
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";


// Custom UI Components
import { 
    Card, 
    CardContent, 
    Button, 
    Input, 
    Select as CustomSelect,  // Rename to avoid conflict
    TextArea, 
    DynamicFieldSection 
} from "./components";

// External Libraries
import Select from "react-select"; // Advanced dropdown for React
import PlusIcon from '../images/buttons/+.png';
import XIcon from '../images/buttons/X.png';


// Error Boundary Component
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }
        return this.props.children;
    }
}
//const OrgForm = async () => {
const OrgForm = () => {
        const [showBusinessDetails, setShowBusinessDetails] = useState(false);
        const [showInefficiency, setShowInefficiency] = useState(false);
        const [showTrainingPrograms, setShowTrainingPrograms] = useState(false);
        const [showTrainingBudget, setShowTrainingBudget] = useState(false);
        const [showVision, setShowVision] = useState(false);
        const [showMission, setShowMission] = useState(false);
        const [showClientCharter, setShowClientCharter] = useState(false); 
        const [certifications, setCertifications] = useState([]);
        const [inefficiencies, setInefficiencies] = useState([]);
        const [keyChallenges, setkeyChallenges] = useState([]);
        const [companyCategory, setCompanyCategory] = useState("Large"); // ✅ Default to Large
      
        // ✅ Define the function before using it in JSX
        const addCertification = () => {setCertifications([...certifications, { id: Date.now(), value: "" }]);};
        const removeCertification = (id) => {setCertifications(certifications.filter(item => item.id !== id));};
        const addInefficiencies = () => {setInefficiencies([...inefficiencies, { id: Date.now(), value: "" }]);};
        const removeInefficiencies = (id) => {setInefficiencies(inefficiencies.filter(item => item.id !== id));};
        const addkeyChallenges = () => {setkeyChallenges([...keyChallenges, { id: Date.now(), value: "" }]); };
        const removeChallenges = (id) => {setkeyChallenges(keyChallenges.filter(item => item.id !== id));};
     
   
       //Employer Categorization
        const categorizeCompany = () => {
        const employeesRaw = getValues("employees") || "0"; // ✅ Default to "0" if undefined
        const turnoverRaw = getValues("turnover") || "0"; // ✅ Default to "0" if undefined
        
        const employees = parseInt(employeesRaw.replace(/,/g, ""), 10) || 0; 
        const turnover = parseFloat(turnoverRaw.replace(/,/g, "")) || 0;
        
        let category = "Large"; // Default to large
        
        const sector = getValues("sectorIndustry") || ""; // ✅ Ensure sector is defined
        
            if (sector === "Manufacturing") {
                if (employees < 5 && turnover <= 300000) {
                    category = "Micro";
                } else if (employees >= 5 && employees <= 74 && turnover > 300000 && turnover <= 15000000) {
                    category = "Small";
                } else if (employees >= 75 && employees <= 200 && turnover > 15000000 && turnover <= 50000000) {
                    category = "Medium";
                }
            } else {
                // Services & Other Sectors
                if (employees < 5 && turnover <= 300000) {
                    category = "Micro";
                } else if (employees >= 5 && employees <= 29 && turnover > 300000 && turnover <= 3000000) {
                    category = "Small";
                } else if (employees >= 30 && employees <= 75 && turnover > 3000000 && turnover <= 20000000) {
                    category = "Medium";
                }
            }
        
            setCompanyCategory(category); // Store in state
            setValue("companyCategory", category); // ✅ Store in form but don't show to user
        };
        
        const formMethods = useForm({
            defaultValues: {
                companyName: "",
                registrationNo: "",
                sector: "",
                industry: "",
                vision: "",
                mission: "",
                clientCharter: "",
                objectives: [],
                kpis: [],
                keyChallenges: [],
                certifications: [],
                trainingPrograms: [],
                trainingBudgets: [], 
                inefficiencies: []
            },
            resolver: yupResolver(
                yup.object().shape({
                    companyName: yup.string().required("Company name is required"),
                    registrationNo: yup.string().required("Registration number is required"),
                    sector: yup.string().required("Sector is required"),
                    industry: yup.string().required("Industry is required"),
                    vision: yup.string().required("Vision is required"),
                    mission: yup.string().required("Mission is required"),
                })
            ),
            mode: "onChange",
            shouldUnregister: true
        });
        

    const handleAdd = (type) => {
        if (type === 'training') {
            addTraining({ title: '', field: '', attendee: '', type: '' });
            setShowTrainingPrograms(true);
        } else if (type === "budget"){
            addTrainingBudgets({ year: '', budget: '', utilization: '', percentage: '0.00' });
            setShowTrainingBudgets(true);
        }
    };

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: {errors},
        setValue,
        getValues,
        watch // ✅ Add watch here!
    } = formMethods;

    const [isLoading, setIsLoading] = useState(true);
    const [msicData, setMsicData] = useState(null);
    const API_ENDPOINT = "http://127.0.0.1:8000/organization/";

    const { fields: objectives, append: addObjective, remove: removeObjective } =
        useFieldArray({ control, name: "objectives" });
    const {
        fields: trainingPrograms = [],
        append: addTraining,
        remove: removeTraining,
    } = useFieldArray({ control, name: "trainingPrograms" });
        const {
        fields: trainingBudgets = [],
        append: addBudget,
        remove: removeBudget,
    } = useFieldArray({ control, name: "trainingBudgets" });
    const {
        fields: kpis,
        append: addKPI,
        remove: removeKPI,
    } = useFieldArray({ control, name: "kpis" });

    //useEffect Property

    //Employers Category
    useEffect(() => {
        categorizeCompany();
    }, [watch("employees"), watch("turnover"), watch("sectorIndustry")]); // Trigger update on changes
    

   // ✅ Initialize Training Programs & Budgets
   useEffect(() => {
    setTimeout(() => {
        if (trainingPrograms.length === 0) {
            addTraining({ title: "", field: "", attendee: "", type: "" });
        }
        if (trainingBudgets.length === 0) {
            addBudget({ year: "", budget: "", utilization: "", percentage: "0.00" });
        }
    //Small delay to ensure state is ready
    }, 100); 
}, [trainingPrograms, trainingBudgets, addTraining, addBudget]);

useEffect(() => {
    if (!showTrainingPrograms && trainingPrograms.length > 0) {
        setShowTrainingPrograms(true);
    }
    if (!showTrainingBudget && trainingBudgets.length > 0) {
        setShowTrainingBudget(true);
    }
}, [trainingPrograms, trainingBudgets]);

// Trining Budget

    useEffect(() => {
        trainingBudgets.forEach((budget, index) => {
            const budgetValue = getValues(`trainingBudgets.${index}.budget`) || 0;
            const utilizationValue = getValues(`trainingBudgets.${index}.utilization`) || 0;
            
            // Ensure calculation happens every time input changes
            if (budgetValue > 0) {
                const newPercentage = ((utilizationValue / budgetValue) * 100).toFixed(2);
                setValue(`trainingBudgets.${index}.percentage`, newPercentage);
            } else {
                setValue(`trainingBudgets.${index}.percentage`, "0.00");
            }
        });
    }, [trainingBudgets, getValues, setValue]); // ✅ Runs every time inputs change

    useEffect(() => {
        console.log("Fetching MSIC Data...");
        const fetchMsicData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/msic_sections_divisions.json");
                console.log("Response:", response);
                const data = await response.json();
                console.log("🧐 MSIC Data Before Processing:", JSON.stringify(data, null, 2));
                setMsicData(data);
                console.log("✅ MSIC Data After Processing:", JSON.stringify(data, null, 2));
            } catch (error) {
                console.error("Error fetching msic data:", error);
                toast.error("Failed to load MSIC data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMsicData();
    }, []); // ✅ Empty dependency array to fetch only once
    
    if (isLoading) return <div>Loading organization data...</div>;
    if (!msicData) return <div>Loading MSIC Data...</div>;
    
    // ✅ Create Dropdown Options (Major Sectors + Nested Industries)
    const sectorOptions = Object.entries(msicData || {}).map(([sectorKey, sectorValue]) => {
        console.log(`🟢 Processing Sector: ${sectorKey}`, sectorValue);
    
        return {
            label: sectorValue.name, // ✅ Major Sector Name
            value: sectorKey, // ✅ Major Sector ID
            options: sectorValue.divisions
                ? Object.entries(sectorValue.divisions).map(([industryKey, industryValue]) => {
                    console.log(`  🔵 Processing Industry: ${industryKey}`, industryValue);
    
                    return {
                        key: `${sectorKey}-${industryKey}`, // ✅ Unique key (Sector-Industry)
                        value: `${sectorKey}-${industryKey}`, // ✅ Store sector & industry together
                        label: typeof industryValue === "string" ? industryValue : industryValue.name, // ✅ Handle both object & string cases
                    };
                })
                : [], // ✅ Ensure empty array if no industries
        };
    });
    
    console.log("✅ Final Dropdown Data:", JSON.stringify(sectorOptions, null, 2));
  
    const onSubmit = async (data) => { // ✅ Ensure this is async
    console.log("🚀 onSubmit Triggered!", data);

    try {
        setIsLoading(true);

        const formattedData = {
            companyName: data.companyName || "Not Provided",
            registrationNo: data.registrationNo || "Not Provided",
            sector: data.sector || "Not Selected",
            industry: data.industry || "Not Selected",
            vision: data.vision || "Not Provided",
            mission: data.mission || "Not Provided",
            clientCharter: data.clientCharter || "Not Provided",
            businessModel: data.businessModel || "Not Selected",
            presence: data.presence || "Not Selected",
            companySize: data.companySize || 0,
            turnover: data.turnover || 0,
            companyCategory: companyCategory, 
            objectives: data.objectives || [],
            keyChallenges: data.keyChallenges || [],
            certifications: data.certifications || [],
            trainingPrograms: data.trainingPrograms || [],
            trainingBudgets: data.trainingBudgets || [],
            inefficiencies: data.inefficiencies || [],
            kpis: data.kpis || []
        };

        console.log("📤 Submitting Data:", formattedData);

        // ✅ Ensure `await` is inside `async` function
        const response = await axios.post(API_ENDPOINT, formattedData);
        console.log("✅ API Response:", response);

        if (response.status === 201 || response.status === 200) {
            toast.success("Organization data saved successfully!");
            formMethods.reset();
        } else {
            toast.error(response.data.message || "Failed to save organization data");
        }
    } catch (error) {
        console.error("❌ API Error:", error.response ? error.response.data : error);
        toast.error("An error occurred while saving the data");
    } finally {
        setIsLoading(false);
    }
};

    
    
    // ✅ Debugging Outside Submission
    console.log("🛠️ Debugging Setup:");
    console.log("formMethods:", formMethods);
    console.log("handleSubmit exists:", typeof formMethods.handleSubmit);
    console.log("onSubmit exists:", typeof onSubmit);
    console.log("Current Validation Errors:", formMethods.formState.errors);
    console.log("🚀 Final SectorOptions Data:", JSON.stringify(sectorOptions, null, 2));
    
  

    // ✅ Return JSX properly

    return (
        <FormProvider {...formMethods}>
            <Card>
                <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Company Information Section */}
                        <section>
                            <h2 className="text-2xl font-semibold">Company Information</h2>

                            {/* ✅ 1st Row: Company Name, Registration No., Sector/Industry */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Company Name */}
                                <div className="flex flex-col">
                                    <label className="font-medium">Company Name</label>
                                    <Input register={register} name="companyName" placeholder="Enter company name" />
                                </div>

                                {/* Company Registration No. */}
                                <div className="flex flex-col">
                                    <label className="font-medium">Company Registration No.</label>
                                    <Input register={register} name="registrationNo" placeholder="Enter registration number" />
                                </div>
                                </div>

                       {/* ✅ Sector/Industry Dropdown */}
                       <div className="flex flex-col mb-4">
  <label className="block text-sm font-medium mb-2">Sector/Industry</label>
  <Controller
    name="sectorIndustry"
    control={control}
    rules={{ required: "Please select a sector and industry" }}
    render={({ field, fieldState }) => (
      <>
        <Select
          {...field}
          options={sectorOptions}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          isSearchable
          placeholder="Select Sector & Industry"
          noOptionsMessage={() => "No matching sectors or industries"}
          classNamePrefix="react-select"
        />
        {fieldState.error && (
          <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
        )}
      </>
    )}
  />
</div>
                               <div className="grid grid-cols-4 gap-4 mt-4">
                                {/* Vision */}
                                <div className="flex flex-col">
                               {/* Inner Container (Horizontal Layout for Label and Button) */}
                               <div className="flex items-center">
                               <label className="font-medium mr-2">Vision</label>
                               {!showVision && (
                               <Button
                               type="button"
                               onClick={() => setShowVision(true)}
                               style={{ backgroundColor: 'transparent', padding: 0 }}>
                               <img src={PlusIcon} alt="Add Vision" className="w-6 h-6" />
                               </Button>
                            )}
                            </div>

                             {/* Textarea (Conditionally Rendered Below) */}
                                {showVision && (<>
                                <TextArea register={register} name="vision" placeholder="Enter vision" />
                                <Button type="button" 
                                onClick={() => setShowVision(false)}
                                style={{ backgroundColor: 'transparent', padding: 0 }}>
                                <img src={XIcon} alt="Remove Vision" className="w-6 h-6" />
                                </Button> </>
                              )}
                           </div>

                                {/* Mission */}
                                <div className="flex flex-col">
                                {/* Inner Container (Horizontal Layout for Label and Button) */}
                                <div className="flex items-center">
                                <label className="font-medium mr-2">Mission</label>
                                {!showMission && (
                               <Button
                                type="button"
                                onClick={() => setShowMission(true)}
                                style={{ backgroundColor: 'transparent', padding: 0 }}>
                               <img src={PlusIcon} alt="Add Mission" className="w-6 h-6" />
                               </Button>
                              )}
                           </div>
                           
                               {/* Textarea (Conditionally Rendered Below) */}
                               {showMission && (<>
                               <TextArea register={register} name="mission" placeholder="Enter mission" />
                               <Button type="button" onClick={() => setShowMission(false)}
                                    style={{ backgroundColor: 'transparent', padding: 0 }}>
                                    <img src={XIcon} alt="Remove Mission" className="w-6 h-6" />
                                </Button></>
                            )}
                            </div>

                            {/* Client Charter */}
                                <div className={{ display: 'flex', alignItems: 'center' }}>
                                    <label className="font-medium mr-2">Client Charter</label>
                                    {!showClientCharter && (
                                        <Button 
                                        type="button" 
                                        onClick={() => setShowClientCharter(true)} 
                                        style={{ backgroundColor: 'transparent', padding: 0 }} > 
                                        <img src={PlusIcon} alt="Add Charter" className="w-6 h-6" />
                                        </Button>
                                    )}
                                    {showClientCharter && (<>
                                            <TextArea register={register} name="clientCharter" placeholder="Enter client charter" />
                                            <Button type="button" onClick={() => setShowClientCharter(false)} 
                                            style={{ backgroundColor: 'transparent', padding: 0 }} >
                                                <img src={XIcon} alt="Remove Charter" className="w-6 h-6" />
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Objectives */}
                                <div className={{ display: 'flex', alignItems: 'left' }}>
                                    <label className="font-medium mr-2">Objectives</label>
                                    {objectives.map((obj, index) => (
                                        <div key={obj.id} className="flex items-center space-x-2 mt-2">
                                        <Input register={register} name={`objectives.${index}.value`} placeholder="Enter objective" />
                                        <Button type="button" onClick={() => removeObjective(index)} 
                                         style={{ backgroundColor: 'transparent', padding: 0 }} > 
                                            <img src={XIcon} alt="Remove Objective" className="w-6 h-6" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" onClick={() => addObjective({ value: '' })} 
                                style={{ backgroundColor: 'transparent', padding: 0 }} > 
                                    <img src={PlusIcon} alt="Add Objective" className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Use a flex container for the heading and button */}
                    <div className="flex flex-col !space-y-0 p-0 m-0">
                    <div className="inline-flex items-center !m-0 !p-0 leading-none">
                    <h2 className="text-lg font-semibold">Business Plan KPIs</h2>
                     <Button
                     type="button"onClick={() => addKPI({ perspective: '', kpiName: '', target: '', achievement: '', status: '' })}
                    style={{ backgroundColor: 'transparent', padding: 0 }}className="ml-2" >
                    <img src={PlusIcon} alt="Add KPI" className="w-6 h-6" />
                    </Button>
                    </div>  </div>
                    
                    <p className="text-sm text-gray-600 !m-0 !p-0 leading-none">
                       Enter key performance indicators (KPIs) categorized under different perspectives.<a
                       href="/BusinessPlan.pdf"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-blue-600 hover:underline">(👉Click here)</a>
                       </p>
                        {kpis.map((kpi, index) => (
                            <div key={kpi.id} className="border rounded p-4 mb-4">
                                <div className="grid grid-cols-5 gap-4">
                                    {/* Perspective Dropdown */}
                                    <CustomSelect
                                        register={register}
                                        name={`kpis.${index}.perspective`}
                                        label="Perspective"
                                        options={[
                                            { value: 'Financial', label: 'Financial' },
                                            { value: 'Customer', label: 'Customer' },
                                            { value: 'Internal Processes', label: 'Internal Processes' },
                                            { value: 'Learning & Growth', label: 'Learning & Growth' },
                                        ]}
                                    />

                                    {/* KPI Name */}
                                    <Input
                                        register={register}
                                        name={`kpis.${index}.kpiName`}
                                        label="KPI Name"
                                        placeholder="e.g., Increase Profits"
                                    />

                                    {/* Target */}
                                    <Input
                                        register={register}
                                        name={`kpis.${index}.target`}
                                        label="Target"
                                        type="text"
                                        placeholder="e.g, 90 million"
                                    />

                                    {/* Achievement (Year-wise) */}
                                    <Input
                                        register={register}
                                        name={`kpis.${index}.achievement`}
                                        label="Achievement (Year-wise)"
                                        type="text"
                                        placeholder="e.g., 95 million"
                                    />

                                    {/* Status Dropdown */}
                                    <CustomSelect
                                        register={register}
                                        name={`kpis.${index}.status`}
                                        label="Status"
                                        options={[
                                            { value: 'Exceed', label: 'Exceed' },
                                            { value: 'Met', label: 'Met' },
                                            { value: 'Not Met', label: 'Not Met' },
                                        ]}
                                    />
                                </div>

                                {/* Remove KPI Button */}
                                <Button
                                    type="button" onClick={() => removeKPI(index)}
                                    style={{ backgroundColor: 'transparent', padding: 0 }}className="ml-2" >
                                    <img src={XIcon} alt="Remove KPI" className="w-6 h-6" />
                                </Button>
                            </div>
                             
                        ))}
 

 <div className="grid grid-cols-2 gap-4 mt-4">
   {/* Column 1: Business & Organization Details */}
<div className="flex flex-col w-full">
    <div className="flex items-center">
        <label className="text-lg font-semibold mr-2">Business & Organization Details</label>
        <Button
            type="button"
            onClick={() => setShowBusinessDetails(!showBusinessDetails)}
            style={{ backgroundColor: 'transparent', padding: 0 }}
            className="ml-2"
        >
            <img src={showBusinessDetails ? XIcon : PlusIcon} alt="Toggle Business Details" className="w-6 h-6" />
        </Button>
    </div>

    {showBusinessDetails && (
        <div className="grid grid-cols-4 gap-4 mt-4">
            {/* Business Model Dropdown */}
            <div className="flex flex-col">
                <label className="font-medium">Business Model</label>
                <select
                    {...register("businessModel")}
                    className="border p-2 rounded-lg"
                >
                    <option value="">Select Business Model</option>
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                </select>
            </div>

            {/* Presence Dropdown */}
            <div className="flex flex-col">
                <label className="font-medium">Presence</label>
                <select
                    {...register("presence")}
                    className="border p-2 rounded-lg"
                >
                    <option value="">Select Presence</option>
                    <option value="Local">Local</option>
                    <option value="Global">Global</option>
                </select>
            </div>

            {/* Employees Input (Formatted as Number) */}
<div className="flex flex-col">
    <label className="font-medium">Employees</label>
    <input
        type="text"
        {...register("employees")}
        className="border p-2 rounded-lg text-right"
        placeholder="Enter number"
        onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
            setValue("employees", value ? parseInt(value).toLocaleString() : "");
        }}
    />
</div>

{/* Turnover Input (Formatted as Currency) */}
<div className="flex flex-col w-full">
        <label className="font-medium">Turnover (RM)</label>
        <input
            type="text"
            {...register("turnover")}
            value={getValues("turnover")}
            onChange={(e) => {
                let rawValue = e.target.value.replace(/[^0-9.]/g, ""); // Allow only numbers & dot
                setValue("turnover", rawValue); // Store raw value
            }}
            onBlur={() => {
                let formattedValue = getValues("turnover")
                    ? parseFloat(getValues("turnover")).toLocaleString(undefined, { minimumFractionDigits: 2 })
                    : "";
                setValue("turnover", formattedValue); // Format only on blur
            }}
            className="border p-2 rounded text-right"
            placeholder="Estimation only"
        />
    </div>
</div>
    )}
</div>

    {/* Column 2: Organization Inefficiency */}
    <div className="flex flex-col w-full">
        <div className="flex items-center">
            <label className="text-lg font-semibold mr-2">Organization Inefficiency</label>
            <Button 
                type="button" 
                onClick={addInefficiencies} 
                style={{ backgroundColor: 'transparent', padding: 0 }} 
                className="ml-2">
                <img src={PlusIcon} alt="Add Inefficiency" className="w-6 h-6" />
            </Button>
        </div>

        <div className="mt-4 space-y-2">
            {inefficiencies.map((field) => (
                <div key={field.id} className="flex items-center space-x-2 w-full">
                    <textarea
                        className="w-full min-h-[50px] p-2 border rounded-lg resize-none"
                        placeholder="What internal inefficiencies impact your organization's performance?"
                        value={field.value}
                        onChange={(e) =>
                            setInefficiencies(inefficiencies.map(item =>
                                item.id === field.id ? { ...item, value: e.target.value } : item
                            ))
                        }
                    />
                    <Button 
                        type="button" 
                        onClick={() => removeInefficiencies(field.id)} 
                        style={{ backgroundColor: 'transparent', padding: 0 }} 
                        className="ml-2">
                        <img src={XIcon} alt="Remove" className="w-6 h-6" />
                    </Button>
                </div>
            ))}
        </div>
    </div>
</div>

{/* New Section - Key Industry Challenges & Industry Certifications */}
<div className="grid grid-cols-2 gap-4 mt-4">
    {/* Column 1: Key Industry Challenges */}
    <div className="flex flex-col w-full">
        <div className="flex items-center">
            <label className="text-lg font-semibold mr-2">Key Industry Challenges</label>
            <Button 
                type="button" 
                onClick={addkeyChallenges} 
                style={{ backgroundColor: 'transparent', padding: 0 }} 
                className="ml-2">
                <img src={PlusIcon} alt="Add Challenge" className="w-6 h-6" />
            </Button>
        </div>

        <div className="mt-4 space-y-2">
            {keyChallenges.map((field) => (
                <div key={field.id} className="flex items-center space-x-2 w-full">
                    <textarea
                        className="w-full min-h-[50px] p-2 border rounded-lg resize-none"
                        placeholder="What external challenges or trends are affecting your industry?"
                        value={field.value}
                        onChange={(e) =>
                            setkeyChallenges(keyChallenges.map(item =>
                                item.id === field.id ? { ...item, value: e.target.value } : item
                            ))
                        }
                    />
                    <Button 
                        type="button"
                        onClick={() => removeChallenges(field.id)}
                        style={{ backgroundColor: 'transparent', padding: 0 }} 
                        className="ml-2">
                        <img src={XIcon} alt="Remove" className="w-6 h-6" />
                    </Button>
                </div>
            ))}
        </div>
    </div>

    {/* Column 2: Industry Certifications/Regulations */}
    <div className="flex flex-col w-full">
        <div className="flex items-center">
            <label className="text-lg font-semibold mr-2">Industry Certifications/Regulations</label>
            <Button 
                type="button" 
                onClick={addCertification} 
                style={{ backgroundColor: 'transparent', padding: 0 }} 
                className="ml-2">
                <img src={PlusIcon} alt="Add Certification" className="w-6 h-6" />
            </Button>
        </div>

        <div className="mt-4 space-y-2">
            {certifications.map((field) => (
                <div key={field.id} className="flex items-center space-x-2 w-full">
                    <textarea
                        className="w-full min-h-[50px] p-2 border rounded-lg resize-none"
                        placeholder="List your organization's certifications (e.g., ISO 9001) and applicable industry regulations"
                        value={field.value}
                        onChange={(e) =>
                            setCertifications(certifications.map(item =>
                                item.id === field.id ? { ...item, value: e.target.value } : item
                            ))
                        }
                    />
                    <Button 
                        type="button" 
                        onClick={() => removeCertification(field.id)} 
                        style={{ backgroundColor: 'transparent', padding: 0 }} 
                        className="ml-2">
                        <img src={XIcon} alt="Remove" className="w-6 h-6" />
                    </Button>
                </div>
            ))}
        </div>
    </div>
</div>

    
    
    {/* Training programs Conducted*/}
    <div className="flex items-center">
    <span className="text-lg font-semibold whitespace-nowrap"> Training Conducted (Past 3 Years) </span>

    {/* Add Button beside the header */}
    <Button
        type="button"
        onClick={() => {if (trainingPrograms.length < 3) { addTraining({ year: '', title: '', field: '', attendee: '', type: '', mode: '' });}
        }}
        disabled={trainingPrograms.length >= 3} // Max 3 rows
        style={{ backgroundColor: 'transparent', padding: 0 }} className="ml-2">
        <img src={PlusIcon} alt="Add Training" className="w-6 h-6" />
    </Button>
</div>

{/* Training Table Headers */}
<div className="grid grid-cols-9 gap-2 font-semibold mt-1">
    <span>Year</span>

    {/* Training Title - Larger column */}
    <span className="col-span-2">Title</span>

    {/* Training Field with (Click here) beside it */}
    <span className="flex items-center">
  Field
  <a
    href="/training_fields.pdf"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 text-sm font-normal ml-1"
  >
    (👉Click here)
  </a>
</span>
<span className="flex items-center">
  Attendee
  <a
    href="/employee.pdf"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 text-sm font-normal ml-1"
  >
    (👉Click here)
  </a>
</span>
    <span>Type</span>
    <span>Mode</span>
</div>

{/* Training Programs Rows */}
{trainingPrograms.length > 0 && (
    <div className="mt-2">
        {trainingPrograms.map((field, index) => (
            <div key={field.id} className="grid grid-cols-9 gap-2 mt-2">
                {/* Year Column (Free-text input with 4-digit restriction) */}
                <input
                    type="text"
                    {...register(`trainingPrograms.${index}.year`, {
                        required: "Year is required",
                        pattern: {
                            value: /^\d{4}$/, // Ensures only 4-digit numbers
                            message: "Enter a valid 4-digit year (e.g., 2023)",
                        },
                    })}
                    placeholder="YYYY"
                    className="border p-1 w-full rounded"
                    maxLength={4}
                />

                {/* Training Title (Takes more space) */}
                <input type="text"
                    {...register(`trainingPrograms.${index}.title`)}
                    placeholder="Training Title"
                    className="border p-1 w-full rounded col-span-2"
                />

                {/* Training Field */}
                <input type="text"
                    {...register(`trainingPrograms.${index}.field`)}
                    placeholder="Enter Field"
                    className="border p-1 w-full rounded"
                />

                {/* Attendee */}
                <select {...register(`trainingPrograms.${index}.attendee`)} className="border p-1 rounded">
                    <option value="">Select Attendee</option>
                    <option value="Non-Executive">Non-Executive</option>
                    <option value="Executive">Executive</option>
                    <option value="Manager">Manager</option>
                    <option value="Top Management">Top Management</option>
                </select>

                {/* Type */}
                <select {...register(`trainingPrograms.${index}.type`)} className="border p-1 rounded">
                    <option value="">Select Type</option>
                    <option value="Online">Online</option>
                    <option value="Non-Online">Non-Online</option>
                </select>

                {/* Mode (New Column) */}
                <select {...register(`trainingPrograms.${index}.mode`)} className="border p-1 rounded">
                    <option value="">Select Mode</option>
                    <option value="In-house">In-house</option>
                    <option value="Public">Public</option>
                    <option value="Overseas">Overseas</option>
                </select>

                {/* Remove Button */}
                <Button
                    type="button"
                    onClick={() => {removeTraining(index);if (trainingPrograms.length === 1) setShowTrainingPrograms(false);
                    }}
                    style={{ backgroundColor: 'transparent', padding: 0 }} className="ml-2">
                    <img src={XIcon} alt="Remove Training" className="w-6 h-6" />
                </Button>
            </div>
        ))}
    </div>
)}


                            {/* Training Budget & Utilization */}
                            <div className="flex flex-col">
                                <label className="text-lg font-semibold">Training Budget & Utilization (Past 3 Years)</label>
                                <Button
    type="button"
    onClick={() => {
        if (trainingBudgets.length < 3) { // ✅ Limit to 3 rows
            addBudget({ year: '', budget: '', utilization: '', percentage: '0.00' });
        } else {
            alert("You can only add up to 3 rows."); // ✅ Alert if exceeded
        }
    }}
    style={{ backgroundColor: 'transparent', padding: 0 }} className="ml-2">
    <img src={PlusIcon} alt="Add Budget" className="w-6 h-6" />
</Button>

                                {/* ✅ Show only when rows exist */}
                                {showTrainingBudget && trainingBudgets.length > 0 && (
                                    <div className="mt-2">
                                        <div className="grid grid-cols-5 gap-2 font-semibold">
                                            <span>Year</span>
                                            <span>Budget (RM)</span>
                                            <span>Utilization (RM)</span>
                                            <span>% Utilization</span>
                                        </div>
                                                    {/* ✅ Budget Rows with Calculation */}
            {trainingBudgets.map((budget, index) => {
                const budgetValue = getValues(`trainingBudgets.${index}.budget`) || 0;
                const utilizationValue = getValues(`trainingBudgets.${index}.utilization`) || 0;
                const calculatedPercentage = budgetValue > 0 ? ((utilizationValue / budgetValue) * 100).toFixed(2) : "0.00";

                return (
                    <div key={budget.id} className="grid grid-cols-5 gap-4 items-center mt-2">
                        {/* Year Input */}
                        <input {...register(`trainingBudgets.${index}.year`)} placeholder="Year" className="input" />

                        {/* Budget Input */}
                        <input {...register(`trainingBudgets.${index}.budget`)} placeholder="Budget (RM)" className="input" />

                        {/* Utilization Input */}
                        <input {...register(`trainingBudgets.${index}.utilization`)} placeholder="Utilization (RM)" className="input" />

                        {/* % Utilization Input (Non-Editable with Click-to-Calculate) */}
                        <div className="flex items-center gap-2">
                            <input
                                value={calculatedPercentage}
                                readOnly
                                className="input bg-gray-200 text-gray-600 cursor-pointer"
                                onClick={() => {
                                    if (budgetValue > 0) {
                                        const newPercentage = ((utilizationValue / budgetValue) * 100).toFixed(2);
                                        setValue(`trainingBudgets.${index}.percentage`, newPercentage);
                                    }
                                }}
                            />
                            
                            {/* Calculate Button */}
                            <Button
                                type="button"
                                onClick={() => {
                                    if (budgetValue > 0) {
                                        const newPercentage = ((utilizationValue / budgetValue) * 100).toFixed(2);
                                        setValue(`trainingBudgets.${index}.percentage`, newPercentage);
                                    }
                                }}
                                className="bg-blue-500 text-white p-1 rounded"
                            >
                                Calculate
                            </Button>
                        </div>

                        {/* Remove Row Button */}
                        <Button type="button" onClick={() => removeBudget(index)} 
                         style={{ backgroundColor: 'transparent', padding: 0 }} className="ml-2">
                            <img src={XIcon} alt="Remove Budget" className="w-6 h-6" />
                        </Button>
                    </div>
                );
            })}
        </div>
    )}
</div>

<button type="submit" className="bg-blue-500 text-white font-bold py-2 px-4 rounded"> Save Organization Data
</button>
                        </form>
                    </CardContent>
                </Card>
            </FormProvider>
    );
};
  export default OrgForm;