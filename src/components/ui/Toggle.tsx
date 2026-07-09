interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
}

export function Toggle({ checked, onChange, ...rest }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-[46px] h-[26px] rounded-full cursor-pointer border-none transition-colors duration-150"
      style={{ background: checked ? 'var(--accent-cyan)' : 'var(--bg-border)' }}
      {...rest}
    >
      <span
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-[left] duration-150"
        style={{ left: checked ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}
      />
    </button>
  );
}
