import json
import re

html_content = open("Kalaghar Product Category Catalog.html").read()

# We will manually extract the categories and create one product for each.
categories = [
    ("Kitchen & Dining", "Cookware Set (Fry Pan, Sauce Pan, Kadai)", "Kitchen & Dining"),
    ("Home Cleaning & Laundry", "Eco-Friendly Cleaning Caddy", "Home & Lifestyle"),
    ("Home Organization & Storage", "Bamboo Wardrobe Organizers", "Home & Lifestyle"),
    ("Furniture", "Handcrafted Wooden Coffee Table", "Furniture"),
    ("Home Decor", "Vintage Brass Wall Decor", "Home Decor"),
    ("Lighting & Electrical", "Handwoven Rattan Table Lamp", "Lighting"),
    ("Bathroom", "Luxury Ceramic Bathroom Accessory Set", "Bathroom"),
    ("Bedroom & Bedding", "Organic Cotton Block-Print Bedsheet", "Bedding"),
    ("Garden & Outdoor", "Terracotta Planter Set", "Garden"),
    ("Home Safety & Utility", "Antique Brass Door Stopper", "Utility"),
    ("Smart Home", "Smart Aroma Diffuser", "Smart Home"),
    ("Small Home Appliances", "Compact Air Purifier", "Appliances"),
    ("Kids & Family Home Products", "Hand-painted Wooden Toy Organizer", "Kids"),
    ("Pet Home Products", "Woven Cane Pet Bed", "Pets"),
    ("Home Improvement & Hardware", "Decorative Brass Cabinet Knobs", "Hardware"),
    ("Home Fragrance", "Sandalwood Reed Diffuser", "Fragrance"),
    ("Sustainable & Reusable Products", "Reusable Bamboo Cutlery Set", "Sustainable"),
    ("Pottery & Ceramics", "Jaipur Blue Pottery Serving Bowl", "pottery"),
    ("Textiles & Handloom", "Banarasi Silk Saree", "textiles"),
    ("Paintings & Folk Art", "Madhubani Canvas Painting", "paintings"),
    ("Handmade Jewellery", "Kundan Bridal Necklace", "jewellery"),
    ("Woodcraft & Carvings", "Sandalwood Carved Elephant", "woodcraft"),
    ("Bamboo & Cane Products", "Bamboo Woven Lampshade", "bamboo")
]

products = []
for i, (cat_name, prod_name, craft_tag) in enumerate(categories):
    keyword = prod_name.split()[0].lower() + "," + prod_name.split()[-1].lower()
    
    prod = {
        "name": prod_name,
        "description": f"Beautiful {prod_name} from our {cat_name} collection. Handpicked for its exceptional quality and design. Perfect for your premium lifestyle.",
        "price": 1000 + (i * 150),
        "stock": 20,
        "craft": craft_tag.lower().replace(" ", "-"),
        "category": cat_name,
        "region": "India",
        "technique": "Premium Quality",
        "artisanEmail": "artisan@kalaghar.in",
        "images": [f"https://loremflickr.com/800/800/{keyword},india?random={i}1", f"https://loremflickr.com/800/800/{keyword}?random={i}2"],
    }
    products.append(prod)

# Read seed.js and replace the artisanProducts array
with open("server/seed.js", "r") as f:
    seed_content = f.read()

# We will use regex to replace the array
pattern = r"const artisanProducts = \[.*?\];"
replacement = "const artisanProducts = " + json.dumps(products, indent=2) + ";"

new_seed = re.sub(pattern, replacement, seed_content, flags=re.DOTALL)

with open("server/seed.js", "w") as f:
    f.write(new_seed)

print("seed.js updated!")
