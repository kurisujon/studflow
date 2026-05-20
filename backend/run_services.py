from __future__ import annotations

import signal
import subprocess
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PYTHON = sys.executable

COMMANDS = [
    [PYTHON, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
    [PYTHON, "-m", "celery", "-A", "core.celery_app.celery_app", "worker", "--loglevel=info", "-P", "solo"],
]


def terminate_processes(processes: list[subprocess.Popen[bytes]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    deadline = time.time() + 5
    while time.time() < deadline:
        if all(process.poll() is not None for process in processes):
            return
        time.sleep(0.1)

    for process in processes:
        if process.poll() is None:
            process.kill()


def main() -> int:
    processes: list[subprocess.Popen[bytes]] = []

    def handle_signal(signum: int, _frame) -> None:
        terminate_processes(processes)
        raise SystemExit(128 + signum)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        for command in COMMANDS:
            processes.append(subprocess.Popen(command, cwd=BASE_DIR))

        while True:
            for process in processes:
                return_code = process.poll()
                if return_code is not None:
                    terminate_processes(processes)
                    return return_code
            time.sleep(0.5)
    finally:
        terminate_processes(processes)


if __name__ == "__main__":
    raise SystemExit(main())
