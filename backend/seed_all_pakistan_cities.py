import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.locations.models import Country, City, Station

# Comprehensive list of Pakistan cities grouped by Province
PAKISTAN_PROVINCES_CITIES = {
    "Punjab": [
        "Ahmed Nager Chatha", "Ali Khan Abad", "Alipur", "Arifwala", "Attock",
        "Bahawalnagar", "Bahawalpur", "Bhakkar", "Bhalwal", "Burewala",
        "Chakwal", "Chichawatni", "Chiniot", "Chishtian", "Choa Saidan Shah",
        "Daska", "Dera Ghazi Khan", "Dina", "Dunya Pur",
        "Faisalabad", "Fateh Jang", "Fazilpur", "Ferozewala",
        "Gojra", "Gujar Khan", "Gujranwala", "Gujrat",
        "Hafizabad", "Haroonabad", "Hasilpur", "Hasan Abdal", "Haveli Lakha",
        "Jahanian", "Jalalpur Jattan", "Jampur", "Jaranwala", "Jauharabad", "Jhang", "Jhelum",
        "Kamalia", "Kamoke", "Kasur", "Khanewal", "Khanpur", "Kharian", "Khushab", "Kot Addu",
        "Lahore", "Lalamusa", "Layyah", "Liaquat Pur", "Lodhran",
        "Mailsi", "Malakwal", "Mandi Bahauddin", "Mian Channu", "Mianwali", "Multan", "Muridke", "Murree", "Muzaffargarh",
        "Nankana Sahib", "Narowal",
        "Okara",
        "Pakpattan", "Pasrur", "Pattoki", "Pindi Bhattian", "Pirmahal",
        "Rahim Yar Khan", "Rajanpur", "Rawalpindi", "Renala Khurd",
        "Sadiqabad", "Sahiwal", "Sambrial", "Samundri", "Sangla Hill", "Sarai Alamgir", "Sargodha", "Shahkot", "Sheikhupura", "Shujaabad", "Sialkot", "Sohawa",
        "Talagang", "Taxila", "Toba Tek Singh",
        "Vehari",
        "Wah Cantt", "Wazirabad"
    ],
    "Sindh": [
        "Badin", "Bandhi", "Berani", "Bhiria City", "Bhiria Road",
        "Chachro", "Chambar", "Chor",
        "Dadu", "Daharki", "Digri", "Diplo", "Dokri",
        "Gambat", "Ghotki",
        "Hala", "Hyderabad",
        "Islamkot",
        "Jacobabad", "Jamshoro", "Jati", "Jhol",
        "Kandhkot", "Kandiaro", "Karachi", "Kashmore", "Keti Bandar", "Khadro", "Khairpur", "Khipro", "Kot Diji", "Kotri", "Kunri",
        "Larkana", "Liaquatpur",
        "Matiari", "Matli", "Mehar", "Mehrabpur", "Miro Khan", "Mirpur Bathoro", "Mirpur Khas", "Mirpur Mathelo", "Mithani", "Mithi", "Moro",
        "Nasirabad", "Naudero", "Naukot", "Naushahro Feroze", "Nawabshah",
        "Pano Akil", "Pir Jo Goth",
        "Radhan", "Rato Dero", "Rohri",
        "Saeedabad", "Sakrand", "Samaro", "Sanghar", "Sehwan Sharif", "Shahdadkot", "Shahdadpur", "Shaheed Benazirabad", "Shahpur Chakar", "Shikarpur", "Sinjhoro", "Sita Road", "Sobhodero", "Sujawal", "Sukkur",
        "Talhar", "Tando Adam", "Tando Allahyar", "Tando Bago", "Tando Ghulam Ali", "Tando Jam", "Tando Mohammad Khan", "Thari Mirwah", "Tharushah", "Thatta", "Thul",
        "Ubauro", "Umerkot",
        "Warah"
    ],
    "Khyber Pakhtunkhwa (KPK)": [
        "Abbottabad", "Alpuri",
        "Bannu", "Batkhela", "Battagram", "Buner",
        "Chakdara", "Charsadda", "Chitral",
        "Daggar", "Dargai", "Dera Ismail Khan", "Dir", "Doaba",
        "Hangu", "Haripur", "Havelian",
        "Karak", "Khal", "Kohat", "Kulachi",
        "Lakki Marwat",
        "Malakand", "Mansehra", "Mardan", "Mingora",
        "Nowshera",
        "Pabbi", "Paharpur", "Parachinar", "Peshawar",
        "Risalpur",
        "Saidu Sharif", "Sarai Naurang", "Shabqadar", "Swabi", "Swat",
        "Takht-i-Bahi", "Tall", "Tank", "Timergara", "Topi", "Torkham"
    ],
    "Balochistan": [
        "Awaran",
        "Barkhan", "Bela", "Bhag",
        "Chaman", "Chitkan",
        "Dalbandin", "Dera Bugti", "Dhadar", "Duki",
        "Gaddani", "Gwadar",
        "Harnai", "Hub",
        "Jafarabad", "Jhal Magsi", "Jiwani",
        "Kalat", "Kharan", "Khuzdar", "Kohlu",
        "Loralai",
        "Mach", "Mastung",
        "Nal", "Naseerabad", "Nushki",
        "Ormara",
        "Panjgur", "Pasni", "Pishin",
        "Quetta",
        "Sibi", "Sohbatpur", "Surab",
        "Turbat",
        "Usta Mohammad", "Uthal",
        "Wadh", "Washuk",
        "Zhob", "Ziarat"
    ],
    "Islamabad Capital Territory": [
        "Islamabad"
    ],
    "Gilgit-Baltistan": [
        "Aliabad (Hunza)", "Astore",
        "Chilas",
        "Danyor", "Diamer",
        "Gahkuch", "Ghizer", "Gilgit", "Gojal",
        "Hunza",
        "Juglot",
        "Karimabad", "Khaplu", "Kharmang",
        "Nagar",
        "Roundu",
        "Shigar", "Skardu",
        "Yasin"
    ],
    "Azad Jammu & Kashmir (AJK)": [
        "Bagh", "Bhimber",
        "Chakswari",
        "Dadyal",
        "Hajira", "Hattian Bala", "Haveli",
        "Islamgarh",
        "Kotli",
        "Mangla", "Mirpur", "Muzaffarabad",
        "Pallandri",
        "Rawalakot",
        "Sehnsa", "Sharda",
        "Taobatt"
    ]
}

def seed_cities():
    country, _ = Country.objects.get_or_create(code="PK", defaults={"name": "Pakistan"})
    created_count = 0
    updated_count = 0

    popular_city_names = {
        "Lahore", "Islamabad", "Karachi", "Rawalpindi", "Peshawar",
        "Faisalabad", "Multan", "Murree", "Quetta", "Gwadar",
        "Sialkot", "Gujranwala", "Hyderabad", "Sukkur", "Abbottabad",
        "Gilgit", "Skardu", "Muzaffarabad", "Mirpur", "Swat", "Mingora"
    }

    for province, cities in PAKISTAN_PROVINCES_CITIES.items():
        for city_name in cities:
            is_pop = city_name in popular_city_names
            city, created = City.objects.get_or_create(
                country=country,
                name=city_name,
                defaults={
                    "state_province": province,
                    "is_popular": is_pop
                }
            )
            if created:
                created_count += 1
            else:
                city.state_province = province
                if is_pop:
                    city.is_popular = True
                city.save()
                updated_count += 1

            # Ensure main terminal/station exists with unique code
            stn_code = f"STN-PK-{city.id}"
            Station.objects.get_or_create(
                code=stn_code,
                defaults={
                    "city": city,
                    "name": f"{city_name} Central Terminal",
                    "address": f"General Bus / Transport Stand, {city_name}, {province}",
                    "is_active": True
                }
            )

    total_cities = City.objects.filter(country=country).count()
    print(f"Successfully seeded Pakistan cities! Created: {created_count}, Updated: {updated_count}, Total in DB: {total_cities}")

if __name__ == "__main__":
    seed_cities()
