import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows";

export default async function fixStockLocation({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Fetching sales channels...");
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  logger.info(`Found ${salesChannels.length} sales channel(s): ${salesChannels.map((sc) => `${sc.name} (${sc.id})`).join(", ")}`);

  logger.info("Fetching stock locations...");
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });
  logger.info(`Found ${stockLocations.length} stock location(s): ${stockLocations.map((sl) => `${sl.name} (${sl.id})`).join(", ")}`);

  if (!stockLocations.length || !salesChannels.length) {
    logger.error("No stock locations or sales channels found. Run the seed script first: pnpm run seed");
    return;
  }

  for (const stockLocation of stockLocations) {
    const salesChannelIds = salesChannels.map((sc) => sc.id);

    logger.info(`Linking all sales channels to stock location "${stockLocation.name}" (${stockLocation.id})...`);

    try {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: stockLocation.id,
          add: salesChannelIds,
        },
      });
      logger.info(`Successfully linked ${salesChannelIds.length} sales channel(s) to "${stockLocation.name}".`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("already exists")) {
        logger.info(`Link already exists for "${stockLocation.name}", skipping.`);
      } else {
        logger.error(`Failed to link: ${message}`);
      }
    }
  }

  logger.info("Done! Stock locations are now linked to sales channels.");
}
