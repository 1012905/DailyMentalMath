fn main() {
    // 强制 MSVC 工具链输出英文，避免 GBK 编码引发 linker 警告
    std::env::set_var("VSLANG", "1033");
    tauri_build::build()
}
