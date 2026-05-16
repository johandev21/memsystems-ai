import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
};

export function getThemeScript() {
	return `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=d?'dark':'light';var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);e.style.colorScheme=r}catch(e){}})();`;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "system",
});

function applyTheme() {
	const root = document.documentElement;
	root.classList.remove("light", "dark");

	const resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";

	root.classList.add(resolved);
	root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme] = useState<Theme>("system");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		applyTheme();
	}, [mounted]);

	useEffect(() => {
		if (!mounted) return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyTheme();
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [mounted]);

	return (
		<ThemeProviderContext value={{ theme }}>{children}</ThemeProviderContext>
	);
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);
	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");
	return context;
}
