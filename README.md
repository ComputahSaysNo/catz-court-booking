# Catz Court Booking

A replacement for the court booking website at St. Catharine's College, Cambridge after the old one went down

Frontend using Vue3: 
```sh
cd frontend
npm install
npm run dev
```

Backend using Django
```sh
cd backend
python3 -m venv env
env/Scripts/activate 
pip install -r requirements.txt
manage.py makemigrations
manage.py migrate
manage.py runserver
```

