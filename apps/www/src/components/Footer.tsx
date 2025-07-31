import {payloadClient} from "@/utils/payloadClient";
import {FooterInterface} from "@repo/typescript-config/typings/payload-types";
import {Footer as FooterUI} from "@repo/ui";

export const Footer = async () => {
	const globalFooter =
		await payloadClient.getGlobal<FooterInterface>("footer");

	return <FooterUI {...globalFooter?.props} />;
};
