# client.py

import socket
import controller_pb2  # сгенерированный из file.proto

DEVICE_IP = '192.168.1.100'
DEVICE_PORT = 7000
BUFFER_SIZE = 4096
TIMEOUT = 5  # секунд


def send_message(sock: socket.socket, msg: controller_pb2.ClientMessage):
    data = msg.SerializeToString()
    sock.sendall(data)


def receive_message(sock: socket.socket) -> controller_pb2.ControllerResponse:
    sock.settimeout(TIMEOUT)
    data = sock.recv(BUFFER_SIZE)
    if not data:
        raise RuntimeError("Нет данных от контроллера")
    resp = controller_pb2.ControllerResponse()
    resp.ParseFromString(data)
    return resp


def get_info(sock: socket.socket) -> str:
    msg = controller_pb2.ClientMessage()
    msg.get_info.SetInParent()
    send_message(sock, msg)
    resp = receive_message(sock)
    if not resp.HasField('info'):
        raise RuntimeError("Не получили Info")
    info = resp.info
    print("\n=== Controller Info ===")
    print(f"IP       : {info.ip}")
    print(f"MAC      : {info.mac}")
    print(f"BLE Name : {info.ble_name}")
    print(f"Token    : {info.token}")
    return info.token


def get_state(sock: socket.socket):
    msg = controller_pb2.ClientMessage()
    msg.get_state.SetInParent()
    send_message(sock, msg)
    resp = receive_message(sock)
    if not resp.HasField('state'):
        raise RuntimeError("Не получили State")
    state = resp.state
    print("\n=== Current State ===")
    print(f"Light       : {'ON' if state.light_on == controller_pb2.On else 'OFF'}")
    print(f"Door Lock   : {'Open' if state.door_lock == controller_pb2.Open else 'Closed'}")
    print(f"Channel 1   : {'ON' if state.channel_1 == controller_pb2.ChannelOn else 'OFF'}")
    print(f"Channel 2   : {'ON' if state.channel_2 == controller_pb2.ChannelOn else 'OFF'}")
    print(f"Temperature : {state.temperature}")
    print(f"Pressure    : {state.pressure}")
    print(f"Humidity    : {state.humidity}")


def set_state(sock: socket.socket, new_state: int):
    msg = controller_pb2.ClientMessage()
    msg.set_state.state = new_state
    send_message(sock, msg)
    resp = receive_message(sock)
    if not resp.HasField('status'):
        raise RuntimeError("Не получили Status")
    status = resp.status
    state_name = controller_pb2.States.Name(new_state)
    print(f"\nSetState → {state_name}: {'OK' if status == controller_pb2.Ok else 'ERROR'}")


def print_menu():
    print("""
=== Menu ===
1) Получить состояние (get_state)
2) Включить свет (LightOn)
3) Выключить свет (LightOff)
4) Открыть замок (DoorLockOpen)
5) Закрыть замок (DoorLockClose)
6) Включить канал 1 (Channel1On)
7) Выключить канал 1 (Channel1Off)
8) Включить канал 2 (Channel2On)
9) Выключить канал 2 (Channel2Off)
0) Выход
""")


def main():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(TIMEOUT)
        print(f"Connecting to {DEVICE_IP}:{DEVICE_PORT}...")
        sock.connect((DEVICE_IP, DEVICE_PORT))
        print("Connected.")

        # Шаг 1: get_info
        token = get_info(sock)

        # Шаг 2: Работа с меню
        while True:
            print_menu()
            choice = input("Выберите действие: ").strip()
            if choice == '1':
                get_state(sock)
            elif choice == '2':
                set_state(sock, controller_pb2.LightOn)
            elif choice == '3':
                set_state(sock, controller_pb2.LightOff)
            elif choice == '4':
                set_state(sock, controller_pb2.DoorLockOpen)
            elif choice == '5':
                set_state(sock, controller_pb2.DoorLockClose)
            elif choice == '6':
                set_state(sock, controller_pb2.Channel1On)
            elif choice == '7':
                set_state(sock, controller_pb2.Channel1Off)
            elif choice == '8':
                set_state(sock, controller_pb2.Channel2On)
            elif choice == '9':
                set_state(sock, controller_pb2.Channel2Off)
            elif choice == '0':
                print("Exiting...")
                break
            else:
                print("Неверный выбор, попробуйте снова.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        sock.close()
        print("Connection closed.")


if __name__ == '__main__':
    main()