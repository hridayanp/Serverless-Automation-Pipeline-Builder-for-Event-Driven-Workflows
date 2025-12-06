import sys
import time

def main():

    print(f"[Task] Starting simulated task... will sleep for 3 seconds.")
    time.sleep(3)
    print(f"[Task] Completed.")

    sys.exit(1)

if __name__ == "__main__":
    main()
