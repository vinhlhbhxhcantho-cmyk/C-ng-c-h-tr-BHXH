export function DraftWarning() {
  return (
    <div className="rounded-md border border-seal/40 bg-seal-bg text-seal px-4 py-3 text-sm flex gap-2 items-start">
      <span className="stamp-badge shrink-0">Bản nháp</span>
      <p>
        Đây là <strong>bản nháp dữ liệu</strong> do công cụ nội bộ hỗ trợ tính toán/soạn thảo, không phải kênh nộp hồ sơ chính thức.
        Hồ sơ đăng ký tham gia BHXH/BHYT/BHTN hiện phải nộp qua <strong>Cổng Dịch vụ công Quốc gia</strong> hoặc phần mềm{" "}
        <strong>I-VAN</strong> kết nối Cổng tiếp nhận hồ sơ (TNHS) của cơ quan BHXH. Các mức tham chiếu, lương tối thiểu vùng, tỷ lệ đóng
        cần được xác minh lại theo văn bản hiện hành tại thời điểm sử dụng.
      </p>
    </div>
  );
}

export function InlineNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-ink/60 italic">{children}</p>;
}
