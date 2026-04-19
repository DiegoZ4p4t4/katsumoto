use serialport::SerialPort;
use std::io::Write;
use std::net::TcpStream;
use std::time::Duration;
use tauri::command;

#[command]
pub async fn print_escpos(port_name: String, baud_rate: u32, data: Vec<u8>) -> Result<(), String> {
    let mut port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_secs(5))
        .open()
        .map_err(|e| format!("Error abriendo puerto {}: {}", port_name, e))?;

    port.write_all(&data)
        .map_err(|e| format!("Error escribiendo en puerto: {}", e))?;

    port.flush()
        .map_err(|e| format!("Error flushing: {}", e))?;

    Ok(())
}

#[command]
pub async fn print_tcp(host: String, port: u16, data: Vec<u8>) -> Result<(), String> {
    let addr = format!("{}:{}", host, port);
    let mut stream = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Direccion invalida: {}", e))?,
        Duration::from_secs(5),
    )
    .map_err(|e| format!("Error conectando a {}: {}", addr, e))?;

    stream
        .write_all(&data)
        .map_err(|e| format!("Error enviando datos: {}", e))?;

    Ok(())
}

#[command]
pub async fn list_serial_ports() -> Result<Vec<String>, String> {
    serialport::available_ports()
        .map(|ports| ports.iter().map(|p| p.port_name.clone()).collect())
        .map_err(|e| format!("Error listando puertos: {}", e))
}

#[command]
pub async fn open_cash_drawer(port_name: String, baud_rate: u32) -> Result<(), String> {
    let esc_drawer: [u8; 5] = [0x1b, 0x70, 0x00, 0x19, 0xfa];
    let mut port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_secs(2))
        .open()
        .map_err(|e| format!("Error abriendo puerto: {}", e))?;

    port.write_all(&esc_drawer)
        .map_err(|e| format!("Error enviando comando cajon: {}", e))?;

    Ok(())
}

#[command]
pub async fn open_cash_drawer_tcp(host: String, port: u16) -> Result<(), String> {
    let esc_drawer: [u8; 5] = [0x1b, 0x70, 0x00, 0x19, 0xfa];
    let addr = format!("{}:{}", host, port);
    let mut stream = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Direccion invalida: {}", e))?,
        Duration::from_secs(5),
    )
    .map_err(|e| format!("Error conectando: {}", e))?;

    stream
        .write_all(&esc_drawer)
        .map_err(|e| format!("Error enviando comando cajon: {}", e))?;

    Ok(())
}

#[command]
pub async fn check_printer_status(port_name: String, baud_rate: u32) -> Result<String, String> {
    let _port = serialport::new(&port_name, baud_rate)
        .timeout(Duration::from_secs(2))
        .open()
        .map_err(|_| "disconnected".to_string())?;
    Ok("ready".to_string())
}

#[command]
pub async fn check_tcp_printer_status(host: String, port: u16) -> Result<String, String> {
    let addr = format!("{}:{}", host, port);
    let _stream = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Direccion invalida: {}", e))?,
        Duration::from_secs(3),
    )
    .map_err(|_| "disconnected".to_string())?;
    Ok("ready".to_string())
}
