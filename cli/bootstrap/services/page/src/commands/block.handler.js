import { commands, error } from '@gnar-engine/core';
import { block } from '../services/block.service.js';
import { validateBlock } from '../schema/page.schema.js';

/**
 * Get single block
 */
commands.register('pageService.getSingleBlock', async ({id}) => {
    if (id) {
        return await block.getById({id: id});
    } else {
        throw new error.badRequest('Block id required');
    }
});

/**
 * Get many blocks
 */
commands.register('pageService.getManyBlocks', async ({ pageSize, pageNum } = {}) => {
    return await block.getAll({ pageSize, pageNum });
});

/**
 * Create blocks
 */
commands.register('pageService.createBlocks', async ({ blocks }) => {
    const validationErrors = [];
    let createdNewBlocks = [];

    for (const newData of blocks) {
        const { errors } = validateBlock(newData);
        if (errors?.length) {
            validationErrors.push(errors);
            continue;
        }

        const created = await block.create(newData);
        createdNewBlocks.push(created);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid block data: ${validationErrors}`);
    }

    return createdNewBlocks;
});

/**
 * Update block
 */
commands.register('pageService.updateBlock', async ({id, newBlockData}) => {

    const validationErrors = [];

    if (!id) {
        throw new error.badRequest('Block ID required');
    }

    const obj = await block.getById({id: id});

    if (!obj) {
        throw new error.notFound('Block not found');
    }

    delete newBlockData.id;

    const { errors } = validateBlock(newBlockData);

    if (errors?.length) {
        validationErrors.push(errors);
    }

    if (validationErrors.length) {
        throw new error.badRequest(`Invalid block data: ${validationErrors}`);
    }

    return await block.update({
        id: id,
        updatedData: newBlockData
    });
});

/**
 * Delete block
 */
commands.register('pageService.deleteBlock', async ({id}) => {
    const obj = await block.getById({id: id});
    if (!obj) {
        throw new error.notFound('Block not found');
    }
    return await block.delete({id: id});
});


commands.register("pageService.exportBlocksCollection", async () => {
  const blocksData = (await block.getAll({ pageSize: 999999, pageNum: 1 })).data;

  const payload = {
    exportedAt: new Date().toISOString(),
    blocks: blocksData,
  };

  const jsonString = JSON.stringify(payload, null, 2);

  await block.writeBackup({
    fileName: "blocks.json",
    contents: jsonString
  });

  return { fileName: "blocks.json", jsonString };
});

commands.register("pageService.importBlocks", async ({ blocks: incomingBlocks }) => {
  if (!Array.isArray(incomingBlocks)) {
    throw new error.badRequest("Import expects { blocks: [...] }");
  }

  const existing = (await block.getAll({ pageSize: 999999, pageNum: 1 })).data;
  const byKey = new Map(existing.filter(b => b?.key).map(b => [b.key, b]));

  const result = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const incomingRaw of incomingBlocks) {
    try {
      if (!incomingRaw?.key) {
        result.skipped++;
        continue;
      }

      // Never trust incoming id
      const { id, ...incoming } = incomingRaw;

      const { errors: validationErrors } = validateBlock(incoming);
      if (validationErrors?.length) {
        result.errors.push({ key: incoming.key, message: `Validation failed: ${JSON.stringify(validationErrors)}` });
        continue;
      }

      const found = byKey.get(incoming.key);

      if (found) {
        await block.update({ id: found.id, updatedData: incoming });
        result.updated++;
      } else {
        await block.create(incoming);
        result.created++;
      }
    } catch (e) {
      result.errors.push({ key: incomingRaw?.key, message: e?.message || String(e) });
    }
  }

  return result;
});

commands.register("pageService.importBlocksFromJsonString", async ({ jsonString }) => {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new error.badRequest("Invalid JSON");
  }

  const blocksArray = Array.isArray(parsed) ? parsed : parsed.blocks;

  return await commands.execute("pageService.importBlocks", {
    blocks: blocksArray,
  });
});
