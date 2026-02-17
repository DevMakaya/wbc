import pandas as pd
import random
import warnings

warnings.filterwarnings("ignore")

random.seed(42)

INPUT_PATH = r"data\Cursor Sample.xlsx"
OUTPUT_PATH = r"data\lenders_cleaned.csv"

BANK_PREFIXES = [
    "First", "United", "National", "Pacific", "Atlantic", "Summit", "Heritage",
    "Pioneer", "Liberty", "Eagle", "Cornerstone", "Meridian", "Frontier",
    "Horizon", "Keystone", "Pinnacle", "Sterling", "Patriot", "Golden",
    "Coastal", "Valley", "Highland", "Bridgewater", "Riverton", "Crestview",
    "Northstar", "Silveroak", "Granite", "Redwood", "Ironwood", "Cedarpoint",
    "Lakeview", "Stonebridge", "Foxridge", "Mapleton", "Oakmont", "Willowbrook",
    "Creekside", "Bayshore", "Ridgewood", "Sunstone", "Ashford", "Whitefield",
    "Brookhaven", "Fairmont", "Thornton", "Glendale", "Millstone", "Clarkson",
    "Edgewater", "Windham", "Rosewood", "Stratton", "Brentwood", "Clearwater",
    "Hawthorne", "Kensington", "Mayfair", "Preston", "Wyndham", "Belmont",
    "Camden", "Dalton", "Eastwood", "Grafton", "Harborview", "Ivywood",
    "Jasper", "Kingston", "Lancaster", "Morrison", "Newfield", "Oakridge",
    "Palmer", "Quincy", "Richmond", "Shelton", "Trenton", "Upton",
    "Vanguard", "Westbrook", "Yarmouth", "Zenith", "Alpine", "BlueRock",
    "Capstone", "Dominion", "Emerald", "Fortress", "Gladstone"
]

BANK_SUFFIXES = ["Bank", "Bancorp", "Financial", "Trust", "Savings Bank", "Credit Union"]
FUND_NAMES = [
    "Capital", "Partners", "Advisors", "Asset Management", "Investments",
    "Capital Group", "Credit Partners", "Lending", "Finance", "Capital Management",
    "Credit", "Funding", "Capital Advisors", "Investment Group"
]
FUND_PREFIXES = [
    "Apex", "Blackthorn", "Crestline", "Denali", "Evergreen", "Falcon",
    "Garrison", "Highbridge", "Ironside", "Juniper", "Kingswood", "Lionsgate",
    "Maven", "Northpoint", "Obsidian", "Paladin", "Quantum", "Redstone",
    "Sapphire", "Triton", "Vantage", "Whitehall", "Xenon", "Yorkville",
    "Zenith", "Arcturus", "Borealis", "Citadel", "Dragonfly", "Eclipse",
    "Fidelitas", "Gryphon", "Halcyon", "Invictus", "Jupiter", "Kronos",
    "Lumina", "Nexus", "Olympus", "Phoenix", "Resolute", "Sentry",
    "Titan", "Umbra", "Veritas", "Warden", "Axiom", "Beacon",
    "Catalyst", "Dynamo", "Epoch", "Fulcrum", "Genesis", "Harbinger",
    "Imperium", "Javelin", "Keystone", "Latitude", "Monarch", "Nomad",
    "Orion", "Prism", "Quasar", "Raptor", "Sigma", "Tempest",
    "Unity", "Vertex", "Wraith", "Xander", "Yonder", "Zephyr",
    "Astra", "Blaze", "Cobalt", "Dusk", "Ember", "Flint",
    "Glacier", "Halo", "Indigo", "Jetstream", "Knightbridge", "Lunar",
    "Meridian", "Nova", "Onyx", "Paragon", "Quill", "Ridge",
    "Summit", "Tidal", "Upland", "Valor", "Willow", "Xcel",
    "Atlas", "Bastion", "Crescent", "Delta", "Equinox", "Forge",
    "Granite", "Horizon", "Iron", "Jade"
]

GLOBAL_AM_NAMES = [
    "Global Advisors", "Asset Management", "Wealth Partners", "Investment Management",
    "Capital Markets", "Securities", "Global Markets", "Investment Solutions"
]
INSURANCE_NAMES = [
    "Insurance Group", "Assurance", "Life Insurance", "Underwriters",
    "Mutual Insurance"
]
MORTGAGE_NAMES = ["Mortgage Corp", "Mortgage Banking", "Home Finance", "Lending Group"]

FIRST_NAMES = [
    "James", "Maria", "Carlos", "Jennifer", "Roberto", "Sarah", "Michael",
    "Ana", "David", "Laura", "Daniel", "Patricia", "Richard", "Monica",
    "Thomas", "Elena", "William", "Sophia", "Christopher", "Isabella",
    "Andrew", "Natalia", "Matthew", "Valentina", "Joshua", "Camila",
    "Robert", "Gabriela", "John", "Alejandra", "Steven", "Victoria",
    "Mark", "Andrea", "Brian", "Carolina", "Kevin", "Paula",
    "Jason", "Diana", "Ryan", "Lucia", "Eric", "Marina",
    "Patrick", "Teresa", "George", "Carmen", "Edward", "Adriana",
    "Peter", "Daniela", "Henry", "Fernanda", "Samuel", "Claudia",
    "Alexander", "Lorena", "Philip", "Mariana", "Antonio", "Silvia",
    "Francisco", "Rosa", "Miguel", "Sandra", "Rafael", "Gloria",
    "Luis", "Raquel", "Arturo", "Pilar", "Enrique", "Alicia",
    "Fernando", "Beatriz", "Gerardo", "Veronica", "Hugo", "Leticia"
]
LAST_NAMES = [
    "Smith", "Johnson", "Martinez", "Garcia", "Rodriguez", "Lopez",
    "Hernandez", "Gonzalez", "Wilson", "Anderson", "Taylor", "Thompson",
    "Brown", "Davis", "Miller", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "White", "Harris", "Clark", "Lewis",
    "Robinson", "Walker", "Young", "Allen", "King", "Wright",
    "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans",
    "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins",
    "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook",
    "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson",
    "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim",
    "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez",
    "Wood", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
    "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers"
]

PHONE_AREA_CODES = [
    "212", "310", "305", "312", "415", "617", "713", "214", "602",
    "480", "520", "512", "646", "917", "347", "786", "954", "561",
    "818", "323", "949", "858", "619", "503", "206", "404", "678",
    "770", "704", "919", "202", "301", "571", "469", "972", "281"
]

used_names = set()


def generate_lender_name(lender_type, location, idx):
    if lender_type in ("Regional Bank", "Local Bank"):
        prefix = BANK_PREFIXES[idx % len(BANK_PREFIXES)]
        suffix = BANK_SUFFIXES[idx % len(BANK_SUFFIXES)]
        name = f"{prefix} {suffix}"
    elif lender_type == "Private Credit Fund":
        prefix = FUND_PREFIXES[idx % len(FUND_PREFIXES)]
        suffix = FUND_NAMES[idx % len(FUND_NAMES)]
        name = f"{prefix} {suffix}"
    elif lender_type == "Global Asset Manager":
        prefix = FUND_PREFIXES[(idx + 30) % len(FUND_PREFIXES)]
        suffix = GLOBAL_AM_NAMES[idx % len(GLOBAL_AM_NAMES)]
        name = f"{prefix} {suffix}"
    elif lender_type == "Insurance Company":
        prefix = FUND_PREFIXES[(idx + 60) % len(FUND_PREFIXES)]
        suffix = INSURANCE_NAMES[idx % len(INSURANCE_NAMES)]
        name = f"{prefix} {suffix}"
    elif lender_type == "Mortgage Banking":
        prefix = BANK_PREFIXES[(idx + 40) % len(BANK_PREFIXES)]
        suffix = MORTGAGE_NAMES[idx % len(MORTGAGE_NAMES)]
        name = f"{prefix} {suffix}"
    elif lender_type == "Family Office":
        prefix = LAST_NAMES[idx % len(LAST_NAMES)]
        name = f"{prefix} Family Office"
    elif lender_type == "Global Bank":
        prefix = FUND_PREFIXES[(idx + 50) % len(FUND_PREFIXES)]
        name = f"{prefix} Global Bank"
    else:
        prefix = FUND_PREFIXES[(idx + 20) % len(FUND_PREFIXES)]
        suffix = FUND_NAMES[(idx + 5) % len(FUND_NAMES)]
        name = f"{prefix} {suffix}"

    original = name
    counter = 2
    while name in used_names:
        name = f"{original} {counter}"
        counter += 1
    used_names.add(name)
    return name


def slugify(name):
    return name.lower().replace(" ", "").replace("&", "and").replace(",", "").replace(".", "")


def generate_contact_data(lender_name, idx):
    first = FIRST_NAMES[idx % len(FIRST_NAMES)]
    last = LAST_NAMES[idx % len(LAST_NAMES)]
    contact_name = f"{first} {last}"

    slug = slugify(lender_name)
    domain = f"{slug}.com"
    website = f"https://www.{domain}"
    email = f"{first.lower()}.{last.lower()}@{domain}"
    linkedin = f"https://www.linkedin.com/company/{slug}"

    area = PHONE_AREA_CODES[idx % len(PHONE_AREA_CODES)]
    p1 = random.randint(200, 999)
    p2 = random.randint(1000, 9999)
    phone = f"+1 ({area}) {p1}-{p2}"

    return contact_name, website, linkedin, email, phone


def normalize_binary(val):
    if pd.isna(val):
        return 0
    if isinstance(val, str):
        if val.strip().upper() == "X":
            return 1
        try:
            return int(float(val))
        except ValueError:
            return 0
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0


def normalize_other_financing(val):
    if pd.isna(val):
        return 0
    if isinstance(val, str):
        stripped = val.strip()
        if stripped.upper() == "X":
            return 1
        if stripped == "0":
            return 0
        if stripped == "":
            return 0
        return stripped
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0


df = pd.read_excel(INPUT_PATH, sheet_name="Lenders_updated", header=1)
df = df.drop(columns=[c for c in df.columns if "Unnamed" in str(c)], errors="ignore")

if df.columns[-1] is None or str(df.columns[-1]).startswith("Unnamed"):
    df = df.iloc[:, :-1]

str_cols = ["Lender Name", "Done", "Website", "Contact Name", "Linkedin Profile", "Contact E-Mail", "Contact Phone"]
for col in str_cols:
    if col in df.columns:
        df[col] = df[col].astype("object")

type_counters = {}
for idx, row in df.iterrows():
    lt = row.get("Lender Type", "Other Lender")
    if pd.isna(lt):
        lt = "Other Lender"
    loc = row.get("Based In", "")
    type_counters[lt] = type_counters.get(lt, 0)
    name = generate_lender_name(lt, loc, type_counters[lt])
    type_counters[lt] += 1

    contact_name, website, linkedin, email, phone = generate_contact_data(name, idx)
    df.at[idx, "Lender Name"] = name
    df.at[idx, "Website"] = website
    df.at[idx, "Contact Name"] = contact_name
    df.at[idx, "Linkedin Profile"] = linkedin
    df.at[idx, "Contact E-Mail"] = email
    df.at[idx, "Contact Phone"] = phone
    df.at[idx, "Done"] = ""

binary_cols = [
    "CRE - Construction", "CRE-Residential", "CRE - Land", "CRE - Office",
    "CRE - Industrial", "CRE - Hotel", "CRE - Retail", "CRE - Other",
    "Real Estate", "Aircraft", "Art", "Insurance Premium", "Yacht", "Sports",
    "Fund - LP", "Fund - NAV", "Fund - GP", "Fund - Mgmt Company", "Fund - SCF",
    "Senior", "Subbordinated", "Recourse", "Non-recourse"
]

for col in binary_cols:
    if col in df.columns:
        df[col] = df[col].apply(normalize_binary)

if "Other Financing (specify)" in df.columns:
    df["Other Financing (specify)"] = df["Other Financing (specify)"].apply(normalize_other_financing)

df["#"] = range(1, len(df) + 1)

geo_col = [c for c in df.columns if "Geographic Coverage" in str(c)]
if geo_col:
    col = geo_col[0]
    df = df.rename(columns={col: "Geographic Coverage"})
    df["Geographic Coverage"] = df["Geographic Coverage"].fillna("").apply(
        lambda x: x.strip() if isinstance(x, str) else x
    )

df.to_csv(OUTPUT_PATH, index=False)
print(f"Lenders output saved to {OUTPUT_PATH}")
print(f"Shape: {df.shape}")
print(f"\nSample rows:")
print(df[["#", "Lender Name", "Website", "Contact Name", "Contact E-Mail", "Lender Type"]].head(10).to_string())
print(f"\nBinary column sample:")
print(df[["Lender Name"] + binary_cols[:6]].head(10).to_string())
