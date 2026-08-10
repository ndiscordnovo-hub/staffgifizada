export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-[3px] border-line border-t-brand-500 animate-spin" />
        <span className="text-sm text-muted">Carregando...</span>
      </div>
    </div>
  );
}
