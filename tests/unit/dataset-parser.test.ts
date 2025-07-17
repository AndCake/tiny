// tiny/tests/unit/dataset-parser.test.ts
import { assertEquals } from "@std/assert";
import { parseDataset, safeParse } from "../../src/dataset-parser.ts";

Deno.test("Dataset Parser", async (t) => {
  await t.step("safeParse", () => {
    assertEquals(
      safeParse('{"name": "Test"}'),
      { name: "Test", json: '{"name": "Test"}' },
    );

    const res = ["test1", "test2"] as string[] & Record<string, string>;
    res.json = '["test1", "test2"]';
    assertEquals(
      safeParse('["test1", "test2"]'),
      res,
    );

    assertEquals(
      safeParse("simple string"),
      "simple string",
    );
  });

  await t.step("parseDataset", () => {
    const mockDataset = {
      name: '{"first": "John"}',
      age: "30",
      active: "true",
    };

    assertEquals(parseDataset(mockDataset), {
      name: {
        first: "John",
        json: '{"first": "John"}',
      },
      age: "30",
      active: "true",
    });
  });
});
