/* eslint-disable no-console */
import axios from "axios";
import { formatISO, set } from "date-fns";
import { toDate } from "date-fns-tz";
import { chain, isNil } from "lodash";
import { retry } from "async";

export type Board = {
  id: number;
  name: string;
}

export type Stage = {
  id: number;
  name: string;
}

export type Task = {
  id: number;
  title: string;
  board: string;
  stage: string;
  user: string;
  desired_date?: string;
  desired_start_date?: string;
}

export class Runrunit {
  private readonly payload;
  constructor(
    private readonly appToken: string,
    private readonly userToken: string) {
    this.payload = {
      baseURL: "https://runrun.it/api",
      headers: {
        "Content-Type": "application/json",
        "App-Key": appToken,
        "User-Token": userToken,
      },
      timeout: 60000,
      validateStatus: (status: number) => status === 200,
    };
  }

  private retryOptions = {
    times: 10,
    interval: (retryCount: number) => {
      if (retryCount > 0) {
        console.log(`Error. Retry count = ${retryCount}`);
      }
      console.log("Returning interval");

      return 60000;
    },
  };

  listBoards = async () => {
    const response = await axios<Board[]>({
      ...this.payload,
      url: "/boards",
    });

    return response.data;
  };

  listStages = async (boardId: string | number): Promise<Stage[]> => {
    const stages = await axios<Stage[]>({
      ...this.payload,
      url: `/v1.0/boards/${boardId}/stages`,
    });

    return stages.data;
  };

  findStageId = (stageName: string, stages: Stage[]): number | undefined => {
    return stages.find((stage) => stage.name === stageName)?.id;
  };

  listTasks = async (boardId: string | number, stageId: number, filter?: (task: Task) => boolean): Promise<Task[]> => {
    const tasks = await axios({
      ...this.payload,
      url: "/v1.0/tasks",
      params: {
        board_id: boardId,
        board_stage_id: stageId,
      //user_id: "jessica-silva",
      },
    });

    return tasks.data
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        board: task.board_name,
        stage: task.board_stage_name,
        user: task.user_name,
        desired_date: task.desired_date,
        desired_start_date: task.desired_start_date,
      }))
      .filter(filter ?? (() => true));
  };

  moveTasks = async (tasks: Task[], fromId: number, toId: number): Promise<void> => {
    const moves = chain(tasks)
      .chunk(20)
      .value();

    for (const move of moves) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await Promise.all(move.map(async (task) => {
        const { id } = task;
        const response = await retry(this.retryOptions, async () => await axios({
          ...this.payload,
          url: `/tasks/${id}/move`,
          method: "POST",
          data: {
            board_stage_id: toId,
            to_board_stage_id: toId,
            from_board_stage_id: fromId,
            check_subtasks: true,
          },
        }).catch((error) => {
          console.error(`Erro ao mover task ${task.id} - ${task.title}`);
          const errorMessage = error.response.data;
          if (error.response.status === 429) {
            throw new Error(errorMessage);
          } else {
            console.error(`Task ${id}: ${task.title} não foi movida!}`, errorMessage);
          }
        }));
        if (response?.data) {
          console.log(`Task ${id} moved: ${response.data.title}`);
        }
      }));
    }
  };

  defineHour = (date: string | number | Date, hours: number, minutes?: number) => {
    return formatISO(set(toDate(date), {
      hours,
      minutes: minutes ?? 0,
      seconds: 0,
      milliseconds: 0,
    }));
  };

  updateDesiredDate = async (tasks: Task[]): Promise<void> => {
    const updates = chain(tasks)
      .chunk(20)
      .value();

    console.log(`Updating ${tasks.length} tasks...`);
    for (const update of updates) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await Promise.all(update.map(async (task) => {
        const { id } = task;
        const desired_date = this.defineHour(task.desired_start_date!, 19);
        const response = await retry(this.retryOptions, async () => await axios({
          ...this.payload,
          url: `/tasks/${id}`,
          method: "PUT",
          data: {
            task: {
              desired_date,
            },
          },
        }).catch((error) => {
          console.error(`Erro ao atualizar task ${task.id} - ${task.title}`);
          const errorMessage = error.response.data;
          if (error.response.status === 429) {
            throw new Error(errorMessage);
          } else {
            console.error(`Task ${id}: ${task.title} não foi atualizada!}`, errorMessage);
          }
        }));
        if (response?.data) {
          console.log(`Task ${id} updated desired_date to ${response.data.desired_date}: ${response.data.title}`);
        }
      }));
    }
  };

  private shouldUpdateDesiredDate = (task: Task): boolean => {
    return isNil(task.desired_date) && !isNil(task.desired_start_date);
  };

}

// export const defaultDateFormat = "yyyy-MM-dd";

// export const toLocalDateString = (date: string | Date): string => {
//   const convertedDate = utcToZonedTime(date, "America/Sao_Paulo");
//   return format(convertedDate, defaultDateFormat);
// }
