import {FC} from "react";

export type LogoProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const Logo: FC<LogoProps> = (props) => {
	return <img {...props} />;
};
