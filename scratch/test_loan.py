import sys
import os
sys.path.append("/home/xibalba/Projects/integrity-oracle/backend/services")

from database import SessionLocal, Agent, LoanLedger, UserProfile
import datetime

db = SessionLocal()
try:
    print("Querying agents...")
    agents = db.query(Agent).all()
    for a in agents:
        print(f"Agent: {a.eth_address}, owner: {a.owner_uid}, current_ais: {a.current_ais}")

    # Test query Verified Voyager
    voyager = db.query(Agent).filter(Agent.eth_address == '0xVoyagerVerified0000000000000000000000000').first()
    if voyager:
        print(f"Found Voyager! owner: {voyager.owner_uid}, ID: {voyager.agent_id}")
        
        # Test creating a LoanLedger entry
        print("Inserting test loan...")
        loan = LoanLedger(
            agent_id=voyager.agent_id,
            amount_itk=100.0,
            due_date=datetime.datetime.utcnow() + datetime.timedelta(days=30)
        )
        db.add(loan)
        db.commit()
        print("Insert successful!")
    else:
        print("Voyager not found!")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
